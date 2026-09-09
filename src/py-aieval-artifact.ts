import { createHash } from 'node:crypto';
import { z } from 'zod';

const semver=/^\d+\.\d+\.\d+$/;
const sha256=/^[a-f0-9]{64}$/;

const manifestSchema=z.object({
  runId:z.string().min(3),
  benchmarkVersion:z.string().regex(semver),
  benchmarkSliceHash:z.string().regex(sha256),
  providerId:z.string().min(1),
  modelId:z.string().min(1),
  modelRevision:z.string().min(1).nullable(),
  runDate:z.string().datetime(),
  temperature:z.number().finite().nonnegative(),
  topP:z.number().finite().positive().max(1),
  maxOutputTokens:z.number().int().positive(),
  seed:z.number().int().nullable(),
  systemPromptHash:z.string().regex(sha256),
}).strict();

const usageSchema=z.object({
  inputTokens:z.number().int().nonnegative().optional(),
  outputTokens:z.number().int().nonnegative().optional(),
}).strict();

const providerMetadataValueSchema=z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const outputSchema=z.object({
  taskId:z.string().min(1),
  text:z.string(),
  finishReason:z.string().min(1),
  latencyMs:z.number().finite().nonnegative(),
  usage:usageSchema.optional(),
  providerMetadata:z.record(z.string(),providerMetadataValueSchema).optional(),
  error:z.string().min(1).optional(),
}).strict();

const scoreRowSchema=z.object({
  taskId:z.string().min(1),
  domain:z.string().min(1),
  score:z.number().finite().min(0).max(1),
  weight:z.number().finite().positive(),
  passed:z.boolean(),
}).strict();

const scoreSummarySchema=z.object({
  score:z.number().finite().min(0).max(1),
  tasks:z.number().int().nonnegative(),
  weight:z.number().finite().nonnegative(),
}).strict();

const operationsSchema=z.object({
  tasks:z.number().int().nonnegative(),
  errors:z.number().int().nonnegative(),
  errorRate:z.number().finite().min(0).max(1),
  latencyMs:z.object({
    p50:z.number().finite().nonnegative().nullable(),
    p95:z.number().finite().nonnegative().nullable(),
  }).strict(),
  tokens:z.object({
    input:z.number().int().nonnegative(),
    output:z.number().int().nonnegative(),
    knownUsageTasks:z.number().int().nonnegative(),
  }).strict(),
}).strict();

const artifactBaseSchema=z.object({
  manifest:manifestSchema,
  outputs:z.array(outputSchema),
  scores:z.object({
    rows:z.array(scoreRowSchema),
    report:z.object({
      overall:scoreSummarySchema,
      domains:z.record(z.string(),scoreSummarySchema),
    }).strict(),
  }).strict(),
  operations:operationsSchema,
}).strict();

type ArtifactBase=z.infer<typeof artifactBaseSchema>;

function nearlyEqual(a:number,b:number){
  return Math.abs(a-b)<=1e-12;
}

function validateConsistency(value:ArtifactBase,ctx:z.RefinementCtx){
  const taskCount=value.outputs.length;
  const errorCount=value.outputs.filter(output=>output.finishReason==='error').length;
  const expectedErrorRate=taskCount===0?0:errorCount/taskCount;

  if(value.operations.tasks!==taskCount){
    ctx.addIssue({code:'custom',message:'Artifact operations task count does not match outputs'});
  }
  if(value.operations.errors!==errorCount){
    ctx.addIssue({code:'custom',message:'Artifact error count does not match outputs'});
  }
  if(!nearlyEqual(value.operations.errorRate,expectedErrorRate)){
    ctx.addIssue({code:'custom',message:'Artifact error rate does not match outputs'});
  }
  if(value.operations.tokens.knownUsageTasks>taskCount){
    ctx.addIssue({code:'custom',message:'Artifact known token-usage count exceeds task count'});
  }
  if(value.scores.rows.length!==taskCount){
    ctx.addIssue({code:'custom',message:'Artifact score-row count does not match outputs'});
  }
  if(value.scores.report.overall.tasks!==value.scores.rows.length){
    ctx.addIssue({code:'custom',message:'Artifact overall score task count does not match score rows'});
  }
  if(taskCount===0){
    if(value.operations.latencyMs.p50!==null||value.operations.latencyMs.p95!==null){
      ctx.addIssue({code:'custom',message:'Artifact empty runs must have null latency percentiles'});
    }
  }else{
    if(value.operations.latencyMs.p50===null||value.operations.latencyMs.p95===null){
      ctx.addIssue({code:'custom',message:'Artifact non-empty runs require latency percentiles'});
    }else if(value.operations.latencyMs.p50>value.operations.latencyMs.p95){
      ctx.addIssue({code:'custom',message:'Artifact p50 latency cannot exceed p95 latency'});
    }
  }

  const outputIds=value.outputs.map(output=>output.taskId);
  const scoreIds=value.scores.rows.map(row=>row.taskId);
  if(new Set(outputIds).size!==outputIds.length){
    ctx.addIssue({code:'custom',message:'Artifact output task identifiers must be unique'});
  }
  if(new Set(scoreIds).size!==scoreIds.length){
    ctx.addIssue({code:'custom',message:'Artifact score task identifiers must be unique'});
  }
  const outputIdSet=new Set(outputIds);
  if(scoreIds.some(id=>!outputIdSet.has(id))||outputIds.some(id=>!new Set(scoreIds).has(id))){
    ctx.addIssue({code:'custom',message:'Artifact output and score task identifiers must match'});
  }

  const totalWeight=value.scores.rows.reduce((sum,row)=>sum+row.weight,0);
  const weightedScore=value.scores.rows.reduce((sum,row)=>sum+row.score*row.weight,0);
  const expectedOverall=totalWeight===0?0:weightedScore/totalWeight;
  if(!nearlyEqual(value.scores.report.overall.weight,totalWeight)){
    ctx.addIssue({code:'custom',message:'Artifact overall weight does not match score rows'});
  }
  if(!nearlyEqual(value.scores.report.overall.score,expectedOverall)){
    ctx.addIssue({code:'custom',message:'Artifact overall score does not match score rows'});
  }
}

const artifactInputSchema=artifactBaseSchema.superRefine(validateConsistency);
const artifactSchema=artifactBaseSchema.extend({
  artifactVersion:z.literal('1.0.0'),
  artifactSha256:z.string().regex(sha256),
}).strict().superRefine((value,ctx)=>validateConsistency(value,ctx));

export type EvalRunArtifactInput=z.infer<typeof artifactInputSchema>;
export type EvalRunArtifact=z.infer<typeof artifactSchema>;

function canonicalize(value:unknown):unknown{
  if(Array.isArray(value))return value.map(canonicalize);
  if(value!==null&&typeof value==='object'){
    const record=value as Record<string,unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map(key=>[key,canonicalize(record[key])]),
    );
  }
  return value;
}

function hashPayload(payload:unknown){
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)),'utf8')
    .digest('hex');
}

function artifactPayload(artifact:Omit<EvalRunArtifact,'artifactSha256'>){
  return {
    artifactVersion:artifact.artifactVersion,
    manifest:artifact.manifest,
    outputs:artifact.outputs,
    scores:artifact.scores,
    operations:artifact.operations,
  };
}

function parseSchema<T>(schema:z.ZodType<T>,value:unknown):T{
  const result=schema.safeParse(value);
  if(!result.success){
    const message=result.error.issues.map(issue=>issue.message).join('; ');
    throw new Error(`Invalid run artifact schema: ${message}`);
  }
  return result.data;
}

export function createRunArtifact(run:EvalRunArtifactInput):EvalRunArtifact{
  const validated=parseSchema(artifactInputSchema,run);
  const payload={artifactVersion:'1.0.0' as const,...validated};
  return {...payload,artifactSha256:hashPayload(artifactPayload(payload))};
}

export function serializeRunArtifact(artifact:EvalRunArtifact){
  const validated=parseSchema(artifactSchema,artifact);
  const expected=hashPayload(artifactPayload(validated));
  if(expected!==validated.artifactSha256)throw new Error('Run artifact checksum mismatch');
  return `${JSON.stringify(canonicalize(validated),null,2)}\n`;
}

export function parseRunArtifact(serialized:string):EvalRunArtifact{
  let parsed:unknown;
  try{
    parsed=JSON.parse(serialized);
  }catch{
    throw new Error('Run artifact is not valid JSON');
  }

  const artifact=parseSchema(artifactSchema,parsed);
  const expected=hashPayload(artifactPayload(artifact));
  if(expected!==artifact.artifactSha256)throw new Error('Run artifact checksum mismatch');
  return artifact;
}
