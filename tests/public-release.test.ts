import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRunArtifact,parseRunArtifact} from '../src/py-aieval-artifact';
import {runEvalSlice,type EvalRunResult,type EvalRunStore} from '../src/py-aieval';
import {createParaguayOfficialRetrievalProvider} from '../src/examples/paraguay-official-retrieval';
import {reasoningDevV01} from '../src/tasksets/reasoning-dev-v0.1';
import {paraguayKnowledgeDevV01} from '../src/tasksets/paraguay-knowledge-dev-v0.1';
import {paraguayanSpanishDevV01} from '../src/tasksets/paraguayan-spanish-dev-v0.1';
import {toolUseDevV01} from '../src/tasksets/tool-use-dev-v0.1';

const memoryStore:EvalRunStore={async persistManifest(){},async persistCompletedRun(_run:EvalRunResult){}};
const stage1RunInput={
  runId:'nova-stage1-paraguay-retrieval-001',
  benchmarkVersion:'0.1.0',
  runDate:'2026-09-09T13:20:00.000Z',
  tasks:paraguayKnowledgeDevV01.tasks,
  provider:createParaguayOfficialRetrievalProvider(),
  temperature:0,
  topP:1,
  maxOutputTokens:32,
  seed:null,
  systemPrompt:'Respondé únicamente con la respuesta solicitada. No agregues explicación.',
  store:memoryStore,
};

test('all public development tasksets remain non-rankable',()=>{
  for(const set of [reasoningDevV01,paraguayKnowledgeDevV01,paraguayanSpanishDevV01,toolUseDevV01])assert.equal(set.rankable,false);
});

test('staged release manifest is frozen to the intended v0.1.0 target',()=>{
  const manifest=JSON.parse(readFileSync('RELEASE-MANIFEST.json','utf8')) as Record<string,string>;
  assert.deepEqual(manifest,{
    releaseVersion:'0.1.0',
    sourcePrivateCommit:'6de32a57258c83add4e011f1deb3640334c08440',
    stage1ArtifactSha256:'4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d',
    publicInventorySha256:'503a415a2558a70fc853cfe500235e19962ad2cca7778a33d77d260ff64c2502',
    canonicalUrl:'https://www.novalabs.com.py/investigacion/benchmark',
    targetRepository:'Nova-Labs-Paraguay/nova-py-aieval',
    releaseState:'staged',
  });
  const packageManifest=JSON.parse(readFileSync('package.json','utf8')) as {version:string};
  assert.equal(packageManifest.version,manifest.releaseVersion);
});

test('citation metadata is prepared but does not claim a public release date while staged',()=>{
  const citation=readFileSync('CITATION.cff','utf8');
  assert.match(citation,/title:\s*"PY-AIEval"/);
  assert.match(citation,/version:\s*"0\.1\.0"/);
  assert.match(citation,/public release pending/i);
  assert.match(citation,/repository-code:\s*"https:\/\/github\.com\/Nova-Labs-Paraguay\/nova-py-aieval"/);
  assert.doesNotMatch(citation,/^date-released:/m);
  assert.doesNotMatch(citation,/cite this release/i);
});

test('Stage 1 artifact is checksum-valid and contains no raw system prompt',()=>{
  const artifact=parseRunArtifact(readFileSync('docs/releases/v0.1.0/stage1-paraguay-retrieval-001.json','utf8'));
  assert.equal(artifact.artifactSha256,'4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d');
  assert.equal(artifact.scores.report.overall.score,1);
  assert.equal(artifact.scores.report.overall.tasks,5);
  assert.equal(artifact.operations.errors,0);
  assert.ok(!('systemPrompt' in artifact.manifest));
});

test('press kit inventory hash matches release manifest',()=>{
  const manifest=JSON.parse(readFileSync('RELEASE-MANIFEST.json','utf8')) as {publicInventorySha256:string};
  const pressKit=readFileSync('PRESS-KIT.md','utf8');
  assert.ok(
    pressKit.includes(`Inventory SHA-256 staged: \`${manifest.publicInventorySha256}\``),
    'PRESS-KIT.md must cite the same inventory SHA-256 as RELEASE-MANIFEST.json',
  );
});

test('standalone public package reproduces the exact Stage 1 artifact',async()=>{
  const stored=parseRunArtifact(readFileSync('docs/releases/v0.1.0/stage1-paraguay-retrieval-001.json','utf8'));
  const fresh=createRunArtifact(await runEvalSlice(stage1RunInput));
  assert.equal(fresh.artifactSha256,stored.artifactSha256);
  assert.equal(fresh.artifactSha256,'4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d');
  assert.equal(fresh.scores.report.overall.score,1);
  assert.equal(fresh.scores.report.overall.tasks,5);
  assert.equal(fresh.operations.errors,0);
  assert.ok(fresh.outputs.every(output=>output.finishReason==='retrieval_hit'));
});
