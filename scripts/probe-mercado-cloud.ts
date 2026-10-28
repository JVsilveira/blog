import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const token=randomBytes(32).toString('base64url');
const config='cloud-admin/wrangler.jsonc';
const name='MERCADOLIVRE_DIAGNOSTIC_TOKEN';
const run=(args:string[],input?:string)=>{const r=spawnSync('node_modules/.bin/wrangler',[...args,'--config',config],{input,encoding:'utf8'});if(r.status!==0)throw new Error('Falha operacional Wrangler; nenhum segredo exibido.');};
run(['secret','bulk'],JSON.stringify({[name]:token}));
try{
 run(['deploy']);
 await new Promise(resolve=>setTimeout(resolve,5000));
 const link=process.argv[2];
 const response=await fetch('https://silfontech-admin.devsilveira.workers.dev/internal/mercadolivre/probe',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({link}),redirect:'manual',signal:AbortSignal.timeout(45000)});
 const body=await response.json();console.log(JSON.stringify({status:response.status,...body},null,2));
}finally{run(['secret','delete',name],'y\n');console.log('Credencial temporária de diagnóstico removida.');}
