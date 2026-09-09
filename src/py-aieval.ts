import { createHash } from 'node:crypto';
import { z } from 'zod';

type JsonValue=string|number|boolean|null|JsonValue[]|{[key:string]:JsonValue};
const jsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(jsonValueSchema),
  z.record(jsonValueSchema),
]));
const jsonObjectSchema=z.record(jsonValueSchema);

const scorerSchema=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('exact_match'),accepted:z.array(z.string().min(1)).min(1),caseSensitive:z.boolean().default(false)}),
  z.object({kind:z.literal('numeric'),expected:z.number().finite(),tolerance:z.number().finite().nonnegative()}),
  z.object({kind:z.literal('json_object'),expected:jsonObjectSchema}),
  z.object({kind:z.literal('tool_call'),tool:z.string().min(1),arguments:jsonObjectSchema,completionState:z.string().min(1)}),
]);

const provenanceSchema=z.object({
  kind:z.enum(['original','public_source','licensed_source']).optional(),
  source:z.string().min(2),reference:z.string().url().optional(),retrievedAt:z.string().date().optional(),license:z.string().min(2).optional(),reviewed:z.literal(true),
});
const evalTaskSchema=z.object({id:z.string().min(3).regex(/^[a-z0-9._-]+$/),version:z.string().regex(/^\d+\.\d+\.\d+$/),domain:z.string().min(2),language:z.string().min(2),prompt:z.string().min(1),weight:z.number().finite().positive(),scorer:scorerSchema,provenance:provenanceSchema});
const runManifestInputSchema=z.object({runId:z.string().min(3),benchmarkVersion:z.string().regex(/^\d+\.\d+\.\d+$/),benchmarkSliceHash:z.string().regex(/^[a-f0-9]{64}$/),providerId:z.string().min(1),modelId:z.string().min(1),modelRevision:z.string().min(1).nullable(),runDate:z.string().datetime(),temperature:z.number().finite().nonnegative(),topP:z.number().finite().positive().max(1),maxOutputTokens:z.number().int().positive(),seed:z.number().int().nullable(),systemPrompt:z.string()});

export type EvalTask=z.infer<typeof evalTaskSchema>;
export type EvalScore={taskId:string;domain:string;score:number;weight:number;passed:boolean};
export type ProviderMetadataValue=string|number|boolean|null;
export type ProviderMetadata=Record<string,ProviderMetadataValue>;
export type StoredModelOutput={taskId:string;text:string;finishReason:string;latencyMs:number;usage?:{inputTokens?:number;outputTokens?:number};providerMetadata?:ProviderMetadata;error?:string};
export type RunManifest={runId:string;benchmarkVersion:string;benchmarkSliceHash:string;providerId:string;modelId:string;modelRevision:string|null;runDate:string;temperature:number;topP:number;maxOutputTokens:number;seed:number|null;systemPromptHash:string};
export type EvalProviderRequest={taskId:string;prompt:string;language:string;systemPrompt:string;temperature:number;topP:number;maxOutputTokens:number;seed:number|null};
export type EvalProviderResult=Omit<StoredModelOutput,'taskId'|'error'>;
export interface EvalProvider{providerId:string;modelId:string;modelRevision:string|null;generate(request:EvalProviderRequest):Promise<EvalProviderResult>}
export type ScoreAggregate={score:number;tasks:number;weight:number};
export type EvalScoreReport={overall:ScoreAggregate;domains:Record<string,ScoreAggregate>};
export type EvalRunScores={rows:EvalScore[];report:EvalScoreReport};
export type EvalRunOperations={tasks:number;errors:number;errorRate:number;latencyMs:{p50:number|null;p95:number|null};tokens:{input:number;output:number;knownUsageTasks:number}};
export type EvalRunResult={manifest:RunManifest;outputs:StoredModelOutput[];scores:EvalRunScores;operations:EvalRunOperations};
export interface EvalRunStore{persistManifest(manifest:RunManifest):Promise<void>;persistCompletedRun(run:EvalRunResult):Promise<void>}
export type RunEvalSliceInput={runId:string;benchmarkVersion:string;runDate:string;tasks:EvalTask[];provider:EvalProvider;temperature:number;topP:number;maxOutputTokens:number;seed:number|null;systemPrompt:string;store:EvalRunStore};
export type ScoreOutputResult={score:number;passed:boolean;reason:string};

export function parseEvalTask(input:unknown):EvalTask{return evalTaskSchema.parse(input)}
function normalizeExact(value:string,caseSensitive:boolean){const normalized=value.normalize('NFKC').trim().replace(/\s+/g,' ');return caseSensitive?normalized:normalized.toLocaleLowerCase('es-PY')}
function canonicalizeJson(value:JsonValue):JsonValue{if(Array.isArray(value))return value.map(canonicalizeJson);if(value!==null&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalizeJson(value[key])]));return value}
function jsonSemanticEqual(left:JsonValue,right:JsonValue){return JSON.stringify(canonicalizeJson(left))===JSON.stringify(canonicalizeJson(right))}
const toolCallOutputSchema=z.object({tool:z.string(),arguments:jsonObjectSchema,completion_state:z.string()}).strict();

export function scoreOutput(task:EvalTask,output:string):ScoreOutputResult{
  const scorer=task.scorer;
  if(scorer.kind==='exact_match'){const actual=normalizeExact(output,scorer.caseSensitive);const passed=scorer.accepted.some(expected=>normalizeExact(expected,scorer.caseSensitive)===actual);return {score:passed?1:0,passed,reason:passed?'exact_match':'no_exact_match'}}
  if(scorer.kind==='numeric'){const value=Number(output.trim().replace(',','.'));const passed=Number.isFinite(value)&&Math.abs(value-scorer.expected)<=scorer.tolerance;return {score:passed?1:0,passed,reason:passed?'within_tolerance':'outside_tolerance'}}
  if(scorer.kind==='json_object'){let parsedJson:unknown;try{parsedJson=JSON.parse(output)}catch{return {score:0,passed:false,reason:'invalid_json'}}const parsed=jsonObjectSchema.safeParse(parsedJson);if(!parsed.success)return {score:0,passed:false,reason:'json_mismatch'};const passed=jsonSemanticEqual(parsed.data,scorer.expected);return {score:passed?1:0,passed,reason:passed?'json_exact':'json_mismatch'}}
  let parsedJson:unknown;try{parsedJson=JSON.parse(output)}catch{return {score:0,passed:false,reason:'invalid_tool_call_json'}}const parsed=toolCallOutputSchema.safeParse(parsedJson);if(!parsed.success)return {score:0,passed:false,reason:'invalid_tool_call_json'};const components=[parsed.data.tool===scorer.tool,jsonSemanticEqual(parsed.data.arguments,scorer.arguments),parsed.data.completion_state===scorer.completionState];const score=components.filter(Boolean).length/components.length;const passed=score===1;return {score,passed,reason:passed?'tool_call_match':'tool_call_partial'}
}

export function aggregateScores(rows:EvalScore[]):EvalScoreReport{
  if(rows.length===0)return {overall:{score:0,tasks:0,weight:0},domains:{}};
  const summarize=(items:EvalScore[]):ScoreAggregate=>{const weight=items.reduce((sum,row)=>sum+row.weight,0);const weighted=items.reduce((sum,row)=>sum+row.score*row.weight,0);return {score:weight===0?0:weighted/weight,tasks:items.length,weight}};
  const domains:Record<string,ScoreAggregate>={};for(const domain of new Set(rows.map(row=>row.domain)))domains[domain]=summarize(rows.filter(row=>row.domain===domain));return {overall:summarize(rows),domains};
}
export function fingerprintText(value:string){const normalized=value.normalize('NFKC').trim().replace(/\s+/g,' ');return createHash('sha256').update(normalized,'utf8').digest('hex')}
export function fingerprintTaskSet(tasks:EvalTask[]){const seen=new Set<string>();const canonical=[...tasks].sort((a,b)=>a.id.localeCompare(b.id)).map(task=>{if(seen.has(task.id))throw new Error(`Duplicate task: ${task.id}`);seen.add(task.id);return {id:task.id,version:task.version,domain:task.domain,language:task.language,prompt:task.prompt,weight:task.weight,scorer:task.scorer,provenance:task.provenance}});return createHash('sha256').update(JSON.stringify(canonical),'utf8').digest('hex')}
export function buildRunManifest(input:unknown):RunManifest{const parsed=runManifestInputSchema.parse(input);const {systemPrompt,...manifest}=parsed;return {...manifest,systemPromptHash:createHash('sha256').update(systemPrompt,'utf8').digest('hex')}}
export function fingerprintRunProtocol(manifest:RunManifest){const protocol={protocolVersion:'1.0.0',benchmarkVersion:manifest.benchmarkVersion,benchmarkSliceHash:manifest.benchmarkSliceHash,temperature:manifest.temperature,topP:manifest.topP,maxOutputTokens:manifest.maxOutputTokens,seed:manifest.seed,systemPromptHash:manifest.systemPromptHash};return createHash('sha256').update(JSON.stringify(protocol),'utf8').digest('hex')}
export function scoreStoredOutputs(tasks:EvalTask[],outputs:StoredModelOutput[]):EvalRunScores{const taskMap=new Map<string,EvalTask>();for(const task of tasks){if(taskMap.has(task.id))throw new Error(`Duplicate task: ${task.id}`);taskMap.set(task.id,task)}const outputMap=new Map<string,StoredModelOutput>();for(const output of outputs){if(!taskMap.has(output.taskId))throw new Error(`Unknown task output: ${output.taskId}`);if(outputMap.has(output.taskId))throw new Error(`Duplicate output: ${output.taskId}`);outputMap.set(output.taskId,output)}const rows:EvalScore[]=tasks.map(task=>{const output=outputMap.get(task.id);if(!output)throw new Error(`Missing output for task: ${task.id}`);if(output.finishReason==='error')return {taskId:task.id,domain:task.domain,score:0,weight:task.weight,passed:false};const result=scoreOutput(task,output.text);return {taskId:task.id,domain:task.domain,score:result.score,weight:task.weight,passed:result.passed}});return {rows,report:aggregateScores(rows)}}
function nearestRank(values:number[],percentile:number){if(values.length===0)return null;const sorted=[...values].sort((a,b)=>a-b);const rank=Math.max(1,Math.ceil(percentile*sorted.length));return sorted[rank-1]}
export function summarizeRunOutputs(outputs:StoredModelOutput[]):EvalRunOperations{const errors=outputs.filter(output=>output.finishReason==='error').length;const latencies=outputs.map(output=>output.latencyMs);let inputTokens=0;let outputTokens=0;let knownUsageTasks=0;for(const output of outputs){if(output.usage){knownUsageTasks+=1;inputTokens+=output.usage.inputTokens??0;outputTokens+=output.usage.outputTokens??0}}return {tasks:outputs.length,errors,errorRate:outputs.length===0?0:errors/outputs.length,latencyMs:{p50:nearestRank(latencies,0.5),p95:nearestRank(latencies,0.95)},tokens:{input:inputTokens,output:outputTokens,knownUsageTasks}}}

export async function runEvalSlice(input:RunEvalSliceInput):Promise<EvalRunResult>{
  const benchmarkSliceHash=fingerprintTaskSet(input.tasks);
  const manifest=buildRunManifest({runId:input.runId,benchmarkVersion:input.benchmarkVersion,benchmarkSliceHash,providerId:input.provider.providerId,modelId:input.provider.modelId,modelRevision:input.provider.modelRevision,runDate:input.runDate,temperature:input.temperature,topP:input.topP,maxOutputTokens:input.maxOutputTokens,seed:input.seed,systemPrompt:input.systemPrompt});
  await input.store.persistManifest(manifest);
  const outputs:StoredModelOutput[]=[];
  for(const task of input.tasks){
    const request:EvalProviderRequest={taskId:task.id,prompt:task.prompt,language:task.language,systemPrompt:input.systemPrompt,temperature:input.temperature,topP:input.topP,maxOutputTokens:input.maxOutputTokens,seed:input.seed};
    try{const result=await input.provider.generate(request);outputs.push({taskId:task.id,...result})}
    catch{outputs.push({taskId:task.id,text:'',finishReason:'error',latencyMs:0,error:'provider_error'})}
  }
  const completedRun:EvalRunResult={manifest,outputs,scores:scoreStoredOutputs(input.tasks,outputs),operations:summarizeRunOutputs(outputs)};
  await input.store.persistCompletedRun(completedRun);
  return completedRun;
}
