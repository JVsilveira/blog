import path from 'node:path';
import {queueHardware,executeHardware,hardwareJob} from '../admin/lib/hardware';
try{
 try{process.loadEnvFile(path.resolve('admin/.env.local'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const root=process.cwd(),job=await queueHardware(root,'sync');await executeHardware(root,job);const result=await hardwareJob(root);
 console.log(result?.message??'Sincronização não concluída.');if(result?.state!=='success')process.exitCode=1;
}catch{console.error('Sincronização indisponível. Confira a configuração ou aguarde a operação atual.');process.exitCode=1;}
