import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
import type { EvalRunResult, EvalRunStore, RunManifest } from './py-aieval';

function serialize(value:unknown){
  return `${JSON.stringify(value,null,2)}\n`;
}

async function writeExclusiveDurable(path:string,value:unknown){
  let handle;
  try{
    handle=await open(path,'wx');
  }catch(error){
    if((error as NodeJS.ErrnoException).code==='EEXIST'){
      throw new Error(`Run evidence already exists at ${path}`);
    }
    throw error;
  }

  try{
    await handle.writeFile(serialize(value),'utf8');
    await handle.sync();
  }finally{
    await handle.close();
  }
}

function runDirectoryFor(rootDirectory:string,runId:string){
  return join(rootDirectory,`run-${encodeURIComponent(runId)}`);
}

export function createFileEvalRunStore(rootDirectory:string){
  if(rootDirectory.trim().length===0)throw new Error('rootDirectory is required');

  const runDirectory=(runId:string)=>runDirectoryFor(rootDirectory,runId);
  const store={
    runDirectory,
    async persistManifest(manifest:RunManifest){
      const directory=runDirectory(manifest.runId);
      await mkdir(directory,{recursive:true});
      await writeExclusiveDurable(join(directory,'manifest.json'),manifest);
    },
    async persistCompletedRun(run:EvalRunResult){
      const directory=runDirectory(run.manifest.runId);
      await mkdir(directory,{recursive:true});
      await writeExclusiveDurable(join(directory,'completed-run.json'),run);
    },
  } satisfies EvalRunStore & {runDirectory(runId:string):string};

  return store;
}
