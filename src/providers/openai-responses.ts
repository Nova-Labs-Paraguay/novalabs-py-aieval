import type { EvalProvider, EvalProviderRequest, EvalProviderResult, ProviderMetadata } from '../py-aieval';

type FetchLike=(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>;

type OpenAIResponsesProviderOptions={
  apiKey:string;
  modelId:string;
  modelRevision?:string|null;
  baseUrl?:string;
  fetchImpl?:FetchLike;
  now?:()=>number;
};

function isRecord(value:unknown):value is Record<string,unknown>{
  return value!==null&&typeof value==='object'&&!Array.isArray(value);
}

async function providerError(response:Response){
  const raw=await response.text();
  let detail=raw.trim();
  try{
    const parsed=JSON.parse(raw) as unknown;
    if(isRecord(parsed)&&isRecord(parsed.error)&&typeof parsed.error.message==='string'){
      detail=parsed.error.message;
    }
  }catch{
    // Preserve the provider's raw text when the error body is not JSON.
  }
  return `OpenAI Responses HTTP ${response.status}: ${detail||response.statusText||'request failed'}`;
}

function extractOutputText(payload:Record<string,unknown>){
  const chunks:string[]=[];
  const output=Array.isArray(payload.output)?payload.output:[];
  for(const item of output){
    if(!isRecord(item)||!Array.isArray(item.content))continue;
    for(const part of item.content){
      if(isRecord(part)&&part.type==='output_text'&&typeof part.text==='string')chunks.push(part.text);
    }
  }
  return chunks.join('\n');
}

function extractUsage(payload:Record<string,unknown>){
  if(!isRecord(payload.usage))return undefined;
  const usage:NonNullable<EvalProviderResult['usage']>={};
  if(typeof payload.usage.input_tokens==='number'&&Number.isInteger(payload.usage.input_tokens)&&payload.usage.input_tokens>=0){
    usage.inputTokens=payload.usage.input_tokens;
  }
  if(typeof payload.usage.output_tokens==='number'&&Number.isInteger(payload.usage.output_tokens)&&payload.usage.output_tokens>=0){
    usage.outputTokens=payload.usage.output_tokens;
  }
  return Object.keys(usage).length>0?usage:undefined;
}

function extractMetadata(payload:Record<string,unknown>):ProviderMetadata{
  const metadata:ProviderMetadata={};
  if(typeof payload.id==='string')metadata.responseId=payload.id;
  if(typeof payload.model==='string')metadata.responseModel=payload.model;
  if(typeof payload.status==='string')metadata.status=payload.status;
  if(isRecord(payload.incomplete_details)&&typeof payload.incomplete_details.reason==='string'){
    metadata.incompleteReason=payload.incomplete_details.reason;
  }
  return metadata;
}

export function createOpenAIResponsesProvider(options:OpenAIResponsesProviderOptions):EvalProvider{
  if(!options.apiKey.trim())throw new Error('OpenAI API key is required');
  if(!options.modelId.trim())throw new Error('OpenAI model id is required');

  const fetchImpl=options.fetchImpl??fetch;
  const now=options.now??(()=>performance.now());
  const endpoint=`${(options.baseUrl??'https://api.openai.com/v1').replace(/\/+$/,'')}/responses`;

  return {
    providerId:'openai-responses',
    modelId:options.modelId,
    modelRevision:options.modelRevision??null,
    async generate(request:EvalProviderRequest):Promise<EvalProviderResult>{
      if(request.seed!==null){
        throw new Error('OpenAI Responses API does not support seed in the documented request schema');
      }

      const started=now();
      const response=await fetchImpl(endpoint,{
        method:'POST',
        headers:{
          authorization:`Bearer ${options.apiKey}`,
          'content-type':'application/json',
        },
        body:JSON.stringify({
          model:options.modelId,
          instructions:request.systemPrompt,
          input:request.prompt,
          temperature:request.temperature,
          top_p:request.topP,
          max_output_tokens:request.maxOutputTokens,
          store:false,
        }),
      });
      const latencyMs=Math.max(0,now()-started);
      if(!response.ok)throw new Error(await providerError(response));

      const parsed=await response.json() as unknown;
      if(!isRecord(parsed))throw new Error('OpenAI Responses API returned a non-object payload');
      const text=extractOutputText(parsed);
      if(text.length===0)throw new Error('OpenAI Responses API returned no output_text');

      const status=typeof parsed.status==='string'?parsed.status:'unknown';
      const incompleteReason=isRecord(parsed.incomplete_details)&&typeof parsed.incomplete_details.reason==='string'
        ?parsed.incomplete_details.reason
        :null;

      return {
        text,
        finishReason:status==='incomplete'&&incompleteReason?`incomplete:${incompleteReason}`:status,
        latencyMs,
        usage:extractUsage(parsed),
        providerMetadata:extractMetadata(parsed),
      };
    },
  };
}
