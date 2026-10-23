import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {publicBuildEnvironment} from '../src/config/deployment';

const env=publicBuildEnvironment(process.env);
for(const args of [
 ['--import','tsx','scripts/validate-content.ts'],
 [path.resolve('node_modules/next/dist/bin/next'),'build'],
 ['--import','tsx','scripts/finalize-export.ts'],
]){
 const result=spawnSync(process.execPath,args,{env,stdio:'inherit',shell:false});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
