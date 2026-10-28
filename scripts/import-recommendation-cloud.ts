import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mercadoLink} from '../src/domain/recommendation-feed';
const link=mercadoLink.parse(process.argv[2]);
const productUrl=process.argv[3]?mercadoLink.parse(process.argv[3]):undefined;
const token=randomBytes(32).toString('base64url'),name='MERCADOLIVRE_DIAGNOSTIC_TOKEN',config='cloud-admin/wrangler.jsonc';
function run(args:string[],input?:string){const result=spawnSync('node_modules/.bin/wrangler',[...args,'--config',config],{input,encoding:'utf8'});if(result.status!==0)throw new Error('Falha operacional Wrangler. Nenhum segredo foi exibido.');}
run(['secret','bulk'],JSON.stringify({[name]:token}));
try{
 run(['deploy']);await new Promise(resolve=>setTimeout(resolve,5000));
 const response=await fetch('https://silfontech-admin.devsilveira.workers.dev/internal/recommendations',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action:'add',link,productUrl}),redirect:'manual',signal:AbortSignal.timeout(60000)});
 const body=await response.json() as {items?:{id:string;name:string;price:{amountCents:number;regularCents:number|null}|null}[];error?:string};
 if(!response.ok)throw new Error(body.error??'Não foi possível importar.');
 console.log(JSON.stringify({status:response.status,items:body.items?.map(item=>({id:item.id,name:item.name,price:item.price}))},null,2));
}finally{run(['secret','delete',name],'y\n');console.log('Credencial temporária removida.');}
