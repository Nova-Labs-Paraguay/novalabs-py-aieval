import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=process.cwd();
const failures=[];
const expectedFiles=[
  '.github/ISSUE_TEMPLATE/bug.yml',
  '.github/ISSUE_TEMPLATE/replication.yml',
  '.github/workflows/ci.yml',
  'CHANGELOG.md',
  'CITATION.cff',
  'CONTRIBUTING.md',
  'LICENSE',
  'PRESS-KIT.md',
  'README.md',
  'RELEASE-CHECKLIST.md',
  'RELEASE-MANIFEST.json',
  'SECURITY.md',
  'docs/CONTAMINATION.md',
  'docs/LIMITATIONS.md',
  'docs/METHODOLOGY.md',
  'docs/REPRODUCIBILITY.md',
  'docs/releases/v0.1.0/STAGE1-PARAGUAY-RETRIEVAL-001.md',
  'docs/releases/v0.1.0/stage1-paraguay-retrieval-001.json',
  'package.json',
  'scripts/verify-release.mjs',
  'src/examples/paraguay-official-retrieval.ts',
  'src/providers/huggingface-chat.ts',
  'src/providers/openai-responses.ts',
  'src/py-aieval-artifact.ts',
  'src/py-aieval-comparison.ts',
  'src/py-aieval-contamination.ts',
  'src/py-aieval-release.ts',
  'src/py-aieval-report.ts',
  'src/py-aieval-store.ts',
  'src/py-aieval.ts',
  'src/tasksets/paraguay-knowledge-dev-v0.1.ts',
  'src/tasksets/paraguayan-spanish-dev-v0.1.ts',
  'src/tasksets/reasoning-dev-v0.1.ts',
  'src/tasksets/tool-use-dev-v0.1.ts',
  'tests/public-release.test.ts',
  'tsconfig.json',
].sort();

const releaseManifest=JSON.parse(readFileSync(join(root,'RELEASE-MANIFEST.json'),'utf8'));
const packageManifest=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const citation=readFileSync(join(root,'CITATION.cff'),'utf8');
const artifact=JSON.parse(readFileSync(join(root,'docs/releases/v0.1.0/stage1-paraguay-retrieval-001.json'),'utf8'));

const expectedManifest={
  releaseVersion:'0.1.0',
  sourcePrivateCommit:'6de32a57258c83add4e011f1deb3640334c08440',
  stage1ArtifactSha256:'4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d',
  publicInventorySha256:'503a415a2558a70fc853cfe500235e19962ad2cca7778a33d77d260ff64c2502',
  canonicalUrl:'https://www.novalabs.com.py/investigacion/benchmark',
  targetRepository:'Nova-Labs-Paraguay/novalabs-py-aieval',
  releaseState:'published',
  releaseTag:'PY-AIEval-v0.1.0',
  releaseDate:'2026-10-03',
};
for(const [key,value] of Object.entries(expectedManifest)){
  if(releaseManifest[key]!==value)failures.push(`release_manifest_${key}_mismatch`);
}
if(Object.keys(releaseManifest).sort().join('\n')!==Object.keys(expectedManifest).sort().join('\n'))failures.push('release_manifest_unexpected_fields');
if(packageManifest.version!==releaseManifest.releaseVersion)failures.push('package_release_version_mismatch');
if(packageManifest.private!==true)failures.push('npm_publication_not_blocked');

if(artifact.artifactSha256!==releaseManifest.stage1ArtifactSha256)failures.push('artifact_sha_mismatch');
if('systemPrompt' in artifact.manifest)failures.push('raw_system_prompt');

if(!/^title:\s*["']?PY-AIEval["']?\s*$/m.test(citation))failures.push('citation_title_mismatch');
if(!/^version:\s*["']?0\.1\.0["']?\s*$/m.test(citation))failures.push('citation_version_mismatch');
if(!citation.includes(`url: "${releaseManifest.canonicalUrl}"`))failures.push('citation_canonical_url_mismatch');
if(!citation.includes(`repository-code: "https://github.com/${releaseManifest.targetRepository}"`))failures.push('citation_repository_mismatch');
if(!new RegExp('^date-released:\\s*["\']?'+releaseManifest.releaseDate+'["\']?\\s*$','m').test(citation))failures.push('citation_release_date_mismatch');
if(/public release pending/i.test(citation))failures.push('citation_still_claims_release_pending');

for(const p of [
  'src/tasksets/reasoning-dev-v0.1.ts',
  'src/tasksets/paraguay-knowledge-dev-v0.1.ts',
  'src/tasksets/paraguayan-spanish-dev-v0.1.ts',
  'src/tasksets/tool-use-dev-v0.1.ts',
]){
  if(!/rankable\s*:\s*false/.test(readFileSync(join(root,p),'utf8')))failures.push(`rankable_taskset:${p}`);
}

const forbidden=[
  /sk-[A-Za-z0-9_-]{12,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._~+\/-]{12,}/i,
  /docs\/competitive\//,
  /lib\/evidence\//,
  /clients\//,
  /private\//,
  /mtdragonn@gmail\.com/i,
  /nggamarra@taxit\.com\.py/i,
  /@taxit\.com\.py/i,
];

const inventory=[];
function walk(dir){
  for(const name of readdirSync(dir).sort()){
    if(name==='node_modules'||name==='.git'||name==='package-lock.json')continue;
    const p=join(dir,name);
    if(statSync(p).isDirectory())walk(p);
    else{
      const rel=relative(root,p).replaceAll('\\','/');
      inventory.push(rel);
      const text=readFileSync(p,'utf8');
      for(const pattern of forbidden)if(pattern.test(`${rel}\n${text}`))failures.push(`forbidden_content:${rel}`);
    }
  }
}
walk(root);
inventory.sort();

for(const path of expectedFiles)if(!inventory.includes(path))failures.push(`missing_file:${path}`);
for(const path of inventory)if(!expectedFiles.includes(path))failures.push(`unexpected_file:${path}`);

const inventorySha256=createHash('sha256').update(inventory.join('\n'),'utf8').digest('hex');
if(releaseManifest.publicInventorySha256!==inventorySha256)failures.push('inventory_sha_mismatch');
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1);}
console.log(JSON.stringify({
  ok:true,
  releaseVersion:releaseManifest.releaseVersion,
  releaseState:releaseManifest.releaseState,
  targetRepository:releaseManifest.targetRepository,
  npmPublishBlocked:packageManifest.private===true,
  inventorySha256,
  files:inventory.length,
}));
