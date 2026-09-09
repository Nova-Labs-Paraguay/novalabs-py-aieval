import type { EvalProvider, EvalProviderRequest, EvalProviderResult, ProviderMetadata } from '../py-aieval';

type FetchLike=(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>;

type HuggingFaceChatProviderOptions={
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
  return `Hugging Face Chat HTTP ${response.status}: ${detail||response.statusText||'request failed'}`;
}

function extractUsage(payload:Record<string,unknown>){
  if(!isRecord(payload.usage))return undefined;
  const usage:NonNullable<EvalProviderResult['usage']>={};
  if(typeof payload.usage.prompt_tokens==='number'&&Number.isInteger(payload.usage.prompt_tokens)&&payload.usage.prompt_tokens>=0){
    usage.inputTokens=payload.usage.prompt_tokens;
  }
  if(typeof payload.usage.completion_tokens==='number'&&Number.isInteger(payload.usage.completion_tokens)&&payload.usage.completion_tokens>=0){
    usage.outputTokens=payload.usage.completion_tokens;
  }
  return Object.keys(usage).length>0?usage:undefined;
}

function extractMetadata(payload:Record<string,unknown>):ProviderMetadata{
  const metadata:ProviderMetadata={};
  if(typeof payload.id==='string')metadata.responseId=payload.id;
  if(typeof payload.model==='string')metadata.responseModel=payload.model;
  if(typeof payload.system_fingerprint==='string')metadata.systemFingerprint=payload.system_fingerprint;
  return metadata;
}

export function createHuggingFaceChatProvider(options:HuggingFaceChatProviderOptions):EvalProvider{
  if(!options.apiKey.trim())throw new Error('Hugging Face API key is required');
  if(!options.modelId.trim())throw new Error('Hugging Face model id is required');

  const fetchImpl=options.fetchImpl??fetch;
  const now=options.now??(()=>performance.now());
  const endpoint=`${(options.baseUrl??'https://router.huggingface.co/v1').replace(/\/+$/,'')}/chat/completions`;

  return {
    providerId:'huggingface-chat',
    modelId:options.modelId,
    modelRevision:options.modelRevision??null,
    async generate(request:EvalProviderRequest):Promise<EvalProviderResult>{
      const body:Record<string,unknown>={
        model:options.modelId,
        messages:[
          {role:'system',content:request.systemPrompt},
          {role:'user',content:request.prompt},
        ],
        temperature:request.temperature,
        top_p:request.topP,
        max_tokens:request.maxOutputTokens,
        stream:false,
      };
      if(request.seed!==null)body.seed=request.seed;

      const started=now();
      const response=await fetchImpl(endpoint,{
        method:'POST',
        headers:{
          authorization:`Bearer ${options.apiKey}`,
          'content-type':'application/json',
        },
        body:JSON.stringify(body),
      });
      const latencyMs=Math.max(0,now()-started);
      if(!response.ok)throw new Error(await providerError(response));

      const parsed=await response.json() as unknown;
      if(!isRecord(parsed))throw new Error('Hugging Face Chat API returned a non-object payload');
      const choice=Array.isArray(parsed.choices)?parsed.choices[0]:undefined;
      if(!isRecord(choice)||!isRecord(choice.message)||typeof choice.message.content!=='string'){
        throw new Error('Hugging Face Chat API returned no assistant message content');
      }

      return {
        text:choice.message.content,
        finishReason:typeof choice.finish_reason==='string'?choice.finish_reason:'unknown',
        latencyMs,
        usage:extractUsage(parsed),
        providerMetadata:extractMetadata(parsed),
      };
    },
  };
}
