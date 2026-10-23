import path from 'node:path';
import {hardwareKind} from '../src/domain/hardware/contracts';
import {queueHardware,executeHardware,hardwareJob} from '../admin/lib/hardware';
try{
 try{process.loadEnvFile(path.resolve('admin/.env.local'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const args=process.argv.slice(2);if(args.length!==2)throw new Error('Uso: npm run hardware:import -- cpu|ram|phone ID_ICECAT');
 const kind=hardwareKind.parse(args[0]),icecatId=args[1]!;const root=process.cwd();const job=await queueHardware(root,'import',[{kind,reference:{icecatId}}]);await executeHardware(root,job);const result=await hardwareJob(root);console.log(result?.message??'Importação não concluída.');if(result?.state!=='success')process.exitCode=1;
}catch{console.error('Não foi possível iniciar a importação. Confira os argumentos e a configuração ou aguarde a operação atual.');process.exitCode=1;}
