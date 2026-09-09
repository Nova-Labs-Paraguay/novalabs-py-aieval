import { createHash } from 'node:crypto';
import { z } from 'zod';
import { fingerprintRunProtocol } from './py-aieval';
import type { EvalRunArtifact } from './py-aieval-artifact';

const sha256=/^[a-f0-9]{64}$/;
const semver=/^\d+\.\d+\.\d+$/;

const domainScoreSchema=z.object({
  domain:z.string().min(1),
  score:z.number().finite().min(0).max(1),
  tasks:z.number().int().nonnegative(),
  weight:z.number().finite().nonnegative(),
}).strict();

const reportBaseSchema=z.object({
  reportVersion:z.literal('1.0.0'),
  artifactSha256:z.string().regex(sha256),
  protocolSha256:z.string().regex(sha256),
  run:z.object({
    runId:z.string().min(3),
    benchmarkVersion:z.string().regex(semver),
    benchmarkSliceHash:z.string().regex(sha256),
    providerId:z.string().min(1),
    modelId:z.string().min(1),
    modelRevision:z.string().min(1).nullable(),
    runDate:z.string().datetime(),
  }).strict(),
  protocol:z.object({
    temperature:z.number().finite().nonnegative(),
    topP:z.number().finite().positive().max(1),
    maxOutputTokens:z.number().int().positive(),
    seed:z.number().int().nullable(),
    systemPromptHash:z.string().regex(sha256),
  }).strict(),
  score:z.object({
    overall:z.number().finite().min(0).max(1),
    tasks:z.number().int().nonnegative(),
    weight:z.number().finite().nonnegative(),
    domains:z.array(domainScoreSchema),
  }).strict(),
  operations:z.object({
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
  }).strict(),
}).strict();

const reportSchema=reportBaseSchema.extend({
  reportSha256:z.string().regex(sha256),
}).strict();

export type EvalReport=z.infer<typeof reportSchema>;

type ReportBase=z.infer<typeof reportBaseSchema>;

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

function hashReportPayload(payload:ReportBase){
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)),'utf8')
    .digest('hex');
}

function reportPayload(report:EvalReport):ReportBase{
  const {reportSha256:_,...payload}=report;
  return payload;
}

export function buildEvalReport(artifact:EvalRunArtifact):EvalReport{
  const domains=Object.entries(artifact.scores.report.domains)
    .sort(([left],[right])=>left.localeCompare(right))
    .map(([domain,summary])=>({domain,...summary}));

  const payload:ReportBase={
    reportVersion:'1.0.0',
    artifactSha256:artifact.artifactSha256,
    protocolSha256:fingerprintRunProtocol(artifact.manifest),
    run:{
      runId:artifact.manifest.runId,
      benchmarkVersion:artifact.manifest.benchmarkVersion,
      benchmarkSliceHash:artifact.manifest.benchmarkSliceHash,
      providerId:artifact.manifest.providerId,
      modelId:artifact.manifest.modelId,
      modelRevision:artifact.manifest.modelRevision,
      runDate:artifact.manifest.runDate,
    },
    protocol:{
      temperature:artifact.manifest.temperature,
      topP:artifact.manifest.topP,
      maxOutputTokens:artifact.manifest.maxOutputTokens,
      seed:artifact.manifest.seed,
      systemPromptHash:artifact.manifest.systemPromptHash,
    },
    score:{
      overall:artifact.scores.report.overall.score,
      tasks:artifact.scores.report.overall.tasks,
      weight:artifact.scores.report.overall.weight,
      domains,
    },
    operations:{
      tasks:artifact.operations.tasks,
      errors:artifact.operations.errors,
      errorRate:artifact.operations.errorRate,
      latencyMs:{...artifact.operations.latencyMs},
      tokens:{...artifact.operations.tokens},
    },
  };

  const validated=reportBaseSchema.parse(payload);
  return {...validated,reportSha256:hashReportPayload(validated)};
}

export function verifyEvalReport(input:unknown):input is EvalReport{
  const parsed=reportSchema.safeParse(input);
  if(!parsed.success)return false;
  return hashReportPayload(reportPayload(parsed.data))===parsed.data.reportSha256;
}

export function serializeEvalReport(report:EvalReport){
  if(!verifyEvalReport(report))throw new Error('Invalid PY-AIEval report checksum or schema');
  return `${JSON.stringify(canonicalize(report),null,2)}\n`;
}

function percent(value:number){
  return `${(value*100).toFixed(2)}%`;
}

function displayNullable(value:string|number|null){
  return value===null?'null':String(value);
}

export function renderEvalReportMarkdown(report:EvalReport){
  if(!verifyEvalReport(report))throw new Error('Invalid PY-AIEval report checksum or schema');

  const domainRows=report.score.domains
    .map(row=>`| ${row.domain} | ${percent(row.score)} | ${row.tasks} | ${row.weight} |`)
    .join('\n');

  return [
    '# PY-AIEval run report',
    '',
    '> Reporte reproducible de una corrida individual. No constituye un leaderboard ni una afirmación comparativa entre modelos.',
    '',
    '## Run',
    '',
    `- Run ID: \`${report.run.runId}\``,
    `- Benchmark: \`${report.run.benchmarkVersion}\``,
    `- Slice SHA-256: \`${report.run.benchmarkSliceHash}\``,
    `- Provider: \`${report.run.providerId}\``,
    `- Model: \`${report.run.modelId}\``,
    `- Model revision: \`${displayNullable(report.run.modelRevision)}\``,
    `- Run date: \`${report.run.runDate}\``,
    `- Source artifact: \`${report.artifactSha256}\``,
    `- Report SHA-256: \`${report.reportSha256}\``,
    '',
    '## Protocol',
    '',
    `- Protocol SHA-256: \`${report.protocolSha256}\``,
    `- Temperature: ${report.protocol.temperature}`,
    `- Top-p: ${report.protocol.topP}`,
    `- Max output tokens: ${report.protocol.maxOutputTokens}`,
    `- Seed: ${displayNullable(report.protocol.seed)}`,
    `- System prompt SHA-256: \`${report.protocol.systemPromptHash}\``,
    '',
    '## Score',
    '',
    `Overall: **${percent(report.score.overall)}** across ${report.score.tasks} tasks (weight ${report.score.weight}).`,
    '',
    '| Domain | Score | Tasks | Weight |',
    '| --- | ---: | ---: | ---: |',
    domainRows,
    '',
    '## Operations',
    '',
    `- Errors: ${report.operations.errors}/${report.operations.tasks} (${percent(report.operations.errorRate)})`,
    `- Latency p50: ${displayNullable(report.operations.latencyMs.p50)} ms`,
    `- Latency p95: ${displayNullable(report.operations.latencyMs.p95)} ms`,
    `- Input tokens: ${report.operations.tokens.input}`,
    `- Output tokens: ${report.operations.tokens.output}`,
    `- Tasks with known usage: ${report.operations.tokens.knownUsageTasks}`,
    '',
  ].join('\n');
}
