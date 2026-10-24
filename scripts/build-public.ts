import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {publicBuildEnvironment} from '../src/config/deployment';
import {importCloudEditorial} from './import-cloud-editorial';

const env=publicBuildEnvironment(process.env);
await importCloudEditorial(env);
// O canal privado termina antes de iniciar o compilador do site público.
for(const key of ['EDITORIAL_EXPORT_TOKEN','EDITORIAL_EXPORT_URL','PAGES_DEPLOY_HOOK','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','EDITORIAL_ADMIN_EMAILS','GEMINI_API_KEY'])delete env[key];
for(const args of [
 ['--import','tsx','scripts/validate-content.ts'],
 [path.resolve('node_modules/next/dist/bin/next'),'build'],
 ['--import','tsx','scripts/finalize-export.ts'],
]){
 const result=spawnSync(process.execPath,args,{env,stdio:'inherit',shell:false});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
