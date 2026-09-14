import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
    dependencyLockSha256:'572ad3d67ffec0fe1caa8234e73f421a013bc3da383fe6bd621e94a2d846688d',
    publicInventorySha256:'fcbb6e01d49eaba7d447210a097ec8a38b297181079710521ec73ab8088d2d7e',
    canonicalUrl:'https://www.novalabs.com.py/investigacion/benchmark',
    targetRepository:'Nova-Labs-Paraguay/nova-py-aieval',
    releaseState:'staged',
  });
  const packageManifest=JSON.parse(readFileSync('package.json','utf8')) as {name:string;version:string;private:boolean};
  assert.equal(packageManifest.version,manifest.releaseVersion);
  assert.equal(packageManifest.private,true,'v0.1.0 is distributed through the public source repository, not the npm registry');
});

test('dependency graph is frozen by lockfile v3 and bound to the release manifest',()=>{
  const manifest=JSON.parse(readFileSync('RELEASE-MANIFEST.json','utf8')) as {dependencyLockSha256:string;releaseVersion:string};
  const packageManifest=JSON.parse(readFileSync('package.json','utf8')) as {name:string;version:string};
  const lockBytes=readFileSync('package-lock.json');
  const lock=JSON.parse(lockBytes.toString('utf8')) as {name:string;version:string;lockfileVersion:number;packages:Record<string,{name?:string;version?:string}>};
  assert.equal(createHash('sha256').update(lockBytes).digest('hex'),manifest.dependencyLockSha256);
  assert.equal(lock.lockfileVersion,3);
  assert.equal(lock.name,packageManifest.name);
  assert.equal(lock.version,packageManifest.version);
  assert.equal(lock.packages['']?.name,packageManifest.name);
  assert.equal(lock.packages['']?.version,packageManifest.version);
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

test('press kit inventory and dependency hashes match release manifest',()=>{
  const manifest=JSON.parse(readFileSync('RELEASE-MANIFEST.json','utf8')) as {publicInventorySha256:string;dependencyLockSha256:string};
  const pressKit=readFileSync('PRESS-KIT.md','utf8');
  assert.ok(pressKit.includes(`Inventory SHA-256 staged: \`${manifest.publicInventorySha256}\``));
  assert.ok(pressKit.includes(`Dependency lock SHA-256 staged: \`${manifest.dependencyLockSha256}\``));
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
