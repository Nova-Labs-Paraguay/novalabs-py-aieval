import { createHash } from 'node:crypto';
import { z } from 'zod';

const sha256=/^[a-f0-9]{64}$/;
const semver=/^\d+\.\d+\.\d+$/;

const fingerprintOptionsSchema=z.object({
  shingleSize:z.number().int().min(2).max(20).default(5),
}).strict();

const fingerprintSchema=z.object({
  normalizedSha256:z.string().regex(sha256),
  tokenCount:z.number().int().positive(),
  shingleSize:z.number().int().min(2).max(20),
  shingleSha256:z.array(z.string().regex(sha256)).min(1),
}).strict();

const auditInputSchema=z.object({
  benchmarkVersion:z.string().regex(semver),
  benchmarkSliceHash:z.string().regex(sha256),
  checkedAt:z.string().datetime(),
  shingleSize:z.number().int().min(2).max(20).default(5),
  containmentThreshold:z.number().finite().min(0).max(1).default(0.8),
  tasks:z.array(z.object({
    taskId:z.string().min(1),
    text:z.string().min(1),
  }).strict()).min(1),
  sources:z.array(z.object({
    sourceId:z.string().min(1),
    reference:z.string().url().optional(),
    text:z.string().min(1),
  }).strict()).min(1),
}).strict();

const auditFingerprintSchema=z.object({
  id:z.string().min(1),
  reference:z.string().url().optional(),
  normalizedSha256:z.string().regex(sha256),
  tokenCount:z.number().int().positive(),
  shingleSize:z.number().int().min(2).max(20),
  shingleSha256:z.array(z.string().regex(sha256)).min(1),
}).strict();

const matchSchema=z.object({
  taskId:z.string().min(1),
  sourceId:z.string().min(1),
  exact:z.boolean(),
  taskContainment:z.number().finite().min(0).max(1),
  jaccard:z.number().finite().min(0).max(1),
  taskNormalizedSha256:z.string().regex(sha256),
  sourceNormalizedSha256:z.string().regex(sha256),
}).strict();

const auditBaseSchema=z.object({
  auditVersion:z.literal('1.0.0'),
  benchmarkVersion:z.string().regex(semver),
  benchmarkSliceHash:z.string().regex(sha256),
  checkedAt:z.string().datetime(),
  shingleSize:z.number().int().min(2).max(20),
  containmentThreshold:z.number().finite().min(0).max(1),
  status:z.enum(['checked_clear','known_overlap']),
  tasks:z.array(auditFingerprintSchema),
  sources:z.array(auditFingerprintSchema),
  matches:z.array(matchSchema),
}).strict();

const auditSchema=auditBaseSchema.extend({
  auditSha256:z.string().regex(sha256),
}).strict();

export type ContaminationFingerprint=z.infer<typeof fingerprintSchema>;
export type ContaminationAudit=z.infer<typeof auditSchema>;
type ContaminationAuditBase=z.infer<typeof auditBaseSchema>;

function hashText(value:string){
  return createHash('sha256').update(value,'utf8').digest('hex');
}

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

function normalizeText(value:string){
  const tokens=value
    .normalize('NFKC')
    .toLocaleLowerCase('es-PY')
    .match(/[\p{L}\p{N}]+/gu)??[];

  if(tokens.length===0)throw new Error('Contamination text must contain at least one letter or number');
  return {tokens,normalized:tokens.join(' ')};
}

function shingleHashes(tokens:string[],size:number){
  const shingles:string[]=[];
  if(tokens.length<size){
    shingles.push(tokens.join(' '));
  }else{
    for(let index=0;index<=tokens.length-size;index+=1){
      shingles.push(tokens.slice(index,index+size).join(' '));
    }
  }

  return [...new Set(shingles.map(hashText))].sort();
}

export function fingerprintContaminationText(
  text:string,
  options:unknown={},
):ContaminationFingerprint{
  const parsed=fingerprintOptionsSchema.parse(options);
  const {tokens,normalized}=normalizeText(text);
  return fingerprintSchema.parse({
    normalizedSha256:hashText(normalized),
    tokenCount:tokens.length,
    shingleSize:parsed.shingleSize,
    shingleSha256:shingleHashes(tokens,parsed.shingleSize),
  });
}

export function compareContaminationFingerprints(
  task:ContaminationFingerprint,
  source:ContaminationFingerprint,
){
  const left=fingerprintSchema.parse(task);
  const right=fingerprintSchema.parse(source);
  if(left.shingleSize!==right.shingleSize){
    throw new Error('Contamination fingerprints must use the same shingle size');
  }

  const taskSet=new Set(left.shingleSha256);
  const sourceSet=new Set(right.shingleSha256);
  let intersection=0;
  for(const value of taskSet){
    if(sourceSet.has(value))intersection+=1;
  }
  const union=new Set([...taskSet,...sourceSet]).size;

  return {
    exact:left.normalizedSha256===right.normalizedSha256,
    sharedShingles:intersection,
    taskContainment:taskSet.size===0?0:intersection/taskSet.size,
    jaccard:union===0?0:intersection/union,
  };
}

function hashAuditPayload(payload:ContaminationAuditBase){
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)),'utf8')
    .digest('hex');
}

function auditPayload(audit:ContaminationAudit):ContaminationAuditBase{
  const {auditSha256:_,...payload}=audit;
  return payload;
}

function assertUnique(values:string[],kind:'task'|'source'){
  const seen=new Set<string>();
  for(const value of values){
    if(seen.has(value))throw new Error(`Duplicate ${kind} identifier: ${value}`);
    seen.add(value);
  }
}

function comparableFingerprint(
  value:z.infer<typeof auditFingerprintSchema>,
):ContaminationFingerprint{
  return {
    normalizedSha256:value.normalizedSha256,
    tokenCount:value.tokenCount,
    shingleSize:value.shingleSize,
    shingleSha256:value.shingleSha256,
  };
}

export function auditTaskContamination(input:unknown):ContaminationAudit{
  const parsed=auditInputSchema.parse(input);
  assertUnique(parsed.tasks.map(task=>task.taskId),'task');
  assertUnique(parsed.sources.map(source=>source.sourceId),'source');

  const tasks=parsed.tasks
    .map(task=>({
      id:task.taskId,
      ...fingerprintContaminationText(task.text,{shingleSize:parsed.shingleSize}),
    }))
    .sort((left,right)=>left.id.localeCompare(right.id));

  const sources=parsed.sources
    .map(source=>({
      id:source.sourceId,
      ...(source.reference?{reference:source.reference}:{}),
      ...fingerprintContaminationText(source.text,{shingleSize:parsed.shingleSize}),
    }))
    .sort((left,right)=>left.id.localeCompare(right.id));

  const matches:ContaminationAuditBase['matches']=[];
  for(const task of tasks){
    for(const source of sources){
      const comparison=compareContaminationFingerprints(
        comparableFingerprint(task),
        comparableFingerprint(source),
      );
      if(comparison.exact||comparison.taskContainment>=parsed.containmentThreshold){
        matches.push({
          taskId:task.id,
          sourceId:source.id,
          exact:comparison.exact,
          taskContainment:comparison.taskContainment,
          jaccard:comparison.jaccard,
          taskNormalizedSha256:task.normalizedSha256,
          sourceNormalizedSha256:source.normalizedSha256,
        });
      }
    }
  }
  matches.sort((left,right)=>left.taskId.localeCompare(right.taskId)||left.sourceId.localeCompare(right.sourceId));

  const payload:ContaminationAuditBase={
    auditVersion:'1.0.0',
    benchmarkVersion:parsed.benchmarkVersion,
    benchmarkSliceHash:parsed.benchmarkSliceHash,
    checkedAt:parsed.checkedAt,
    shingleSize:parsed.shingleSize,
    containmentThreshold:parsed.containmentThreshold,
    status:matches.length===0?'checked_clear':'known_overlap',
    tasks,
    sources,
    matches,
  };

  const validated=auditBaseSchema.parse(payload);
  return {...validated,auditSha256:hashAuditPayload(validated)};
}

export function verifyContaminationAudit(input:unknown):input is ContaminationAudit{
  const parsed=auditSchema.safeParse(input);
  if(!parsed.success)return false;

  const expectedStatus=parsed.data.matches.length===0?'checked_clear':'known_overlap';
  if(parsed.data.status!==expectedStatus)return false;
  return hashAuditPayload(auditPayload(parsed.data))===parsed.data.auditSha256;
}

export function serializeContaminationAudit(audit:ContaminationAudit){
  if(!verifyContaminationAudit(audit))throw new Error('Invalid contamination audit checksum or schema');
  return `${JSON.stringify(canonicalize(audit),null,2)}\n`;
}
