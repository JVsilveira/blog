import path from 'node:path';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {z} from 'zod';
import {phoneRankingSchema} from '../../src/domain/hardware/bestsellers';
import {authorizedRetailerEnvironment} from './retailers';
import {mercadoConnected} from './mercadolivre';
import {withWorkspaceLock} from './workspace';
const running=new Map<string,Promise<void>>();
// This is a category sales ranking, never a claim about sales by the affiliate.
export async function refreshPhoneRanking(root:string,env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch,now=Date.now(),force=false){
 if(!await mercadoConnected(root,env))return;
 if(running.has(root))return running.get(root);
 const task=(async()=>{
  const stateFile=path.join(root,'.editorial-admin/phone-ranking-state.json');
  try{const prior=JSON.parse(await readFile(stateFile,'utf8'));if(!force&&typeof prior.nextAttempt==='number'&&prior.nextAttempt>now)return;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const get=async(url:string)=>{const response=await fetcher(url,{headers:{Authorization:`Bearer ${env.MERCADOLIVRE_ACCESS_TOKEN}`},redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Ranking indisponível');const reader=response.body?.getReader();if(!reader)throw new Error('Resposta vazia');let size=0;const parts:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>1000000){await reader.cancel();throw new Error('Resposta acima do limite');}parts.push(part.value);}return JSON.parse(Buffer.concat(parts).toString());};
  const persist=async(file:string,data:unknown,mode:number)=>{await mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp-'+process.pid;await writeFile(temp,JSON.stringify(data),{mode});await rename(temp,file);};
  try{
   env=await authorizedRetailerEnvironment(root,env,fetcher);
   const category=z.object({id:z.literal('MLB1055'),name:z.string()}).parse(await get('https://api.mercadolibre.com/categories/MLB1055'));
   if(!/celulares|smartphones/i.test(category.name))throw new Error('Categoria inesperada');
   const response=z.object({query_data:z.object({highlight_type:z.literal('BEST_SELLER'),criteria:z.literal('CATEGORY'),id:z.literal('MLB1055')}),content:z.array(z.object({id:z.string(),type:z.string(),position:z.number().int().min(1).max(20)})).max(20)}).parse(await get('https://api.mercadolibre.com/highlights/MLB/category/MLB1055'));
   const items=response.content.filter(row=>['ITEM','PRODUCT'].includes(row.type)&&/^MLB\d+$/.test(row.id));
   if(new Set(items.map(i=>i.position)).size!==items.length)throw new Error('Ranking inconsistente');
   const feed=phoneRankingSchema.parse({updatedAt:new Date(now).toISOString(),expiresAt:new Date(now+48*3600000).toISOString(),category:'MLB1055',items});
   await withWorkspaceLock(root,async()=>{for(const dir of ['.editorial-admin','public/data/hardware','out/data/hardware'])await persist(path.join(root,dir,'bestsellers.json'),feed,dir.startsWith('.')?0o600:0o644);await persist(stateFile,{state:'ready',nextAttempt:now+24*3600000},0o600);});
  }catch{await withWorkspaceLock(root,()=>persist(stateFile,{state:'unavailable',nextAttempt:now+15*60000},0o600));}
 })();running.set(root,task);try{await task;}finally{running.delete(root);}
}
