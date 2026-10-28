import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const token=randomBytes(32).toString('base64url'),name='MERCADOLIVRE_DIAGNOSTIC_TOKEN',config='cloud-admin/wrangler.jsonc';
function run(args:string[],input?:string){const result=spawnSync('node_modules/.bin/wrangler',[...args,'--config',config],{input,encoding:'utf8'});if(result.status!==0)throw new Error('Falha operacional Wrangler. Nenhum segredo foi exibido.');}
run(['secret','bulk'],JSON.stringify({[name]:token}));
try{
 run(['deploy']);await new Promise(resolve=>setTimeout(resolve,5000));
 const rounds=Math.max(1,Math.min(8,Number(process.argv[2])||1));
 for(let round=0;round<rounds;round++){
  const response=await fetch('https://silfontech-admin.devsilveira.workers.dev/internal/recommendation-discovery',{method:'POST',headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(90000)});
  const body=await response.json() as {items?:{id:string;name:string;category:string;discount:number;price:{amountCents:number}|null}[];state?:unknown;error?:string};if(!response.ok)throw new Error(body.error??'Busca recusada.');
  console.log(JSON.stringify({round:round+1,count:body.items?.length,state:body.state,examples:body.items?.slice(0,5).map(item=>({id:item.id,name:item.name,category:item.category,discount:item.discount,priceCents:item.price?.amountCents}))},null,2));
 }
}finally{run(['secret','delete',name],'y\n');console.log('Credencial temporária removida.');}
