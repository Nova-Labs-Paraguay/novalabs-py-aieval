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
const artifact=JSON.parse(readFileSync(join(root,'docs/releases/v0.1.0/stage1-paraguay-retrieval-001.json'),'utf8'));
if(artifact.artifactSha256!=='4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d')failures.push('artifact_sha_mismatch');
if('systemPrompt' in artifact.manifest)failures.push('raw_system_prompt');

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
console.log(JSON.stringify({ok:true,inventorySha256,files:inventory.length}));
