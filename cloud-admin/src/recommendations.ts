import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {AdminError} from '../../admin/lib/config';
import {mercadoLink,recommendationCardSchema,type RecommendationCard,currentPrice} from '../../src/domain/recommendation-feed';
import {mercadoAccess,resolveMercadoLink} from './mercadolivre';
import type {Env} from './types';

const prefix='recommendation:';
const snapshotSchema=recommendationCardSchema.extend({lastError:z.string().nullable().optional()});
export const recommendationAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('add'),link:mercadoLink,productUrl:mercadoLink.optional()}),
 z.object({action:z.literal('refresh')}),
 z.object({action:z.literal('remove'),id:z.string().regex(/^MLB\d{5,20}$/)}),
]);
type Stored=z.infer<typeof snapshotSchema>;
const finitePrice=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>0&&Number.isSafeInteger(Math.round(value*100))?Math.round(value*100):null;
async function api(path:string,token:string){
 const response=await fetch('https://api.mercadolibre.com'+path,{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new AdminError(response.status===403?'A API não liberou esta consulta.':response.status===404?'Produto não encontrado na loja.':'A loja não respondeu. Tente novamente.',response.status===404?404:502);
 const reader=response.body?.getReader();if(!reader)throw new AdminError('Resposta vazia da loja.',502);const parts:Uint8Array[]=[];let total=0;
 while(true){const next=await reader.read();if(next.done)break;total+=next.value.length;if(total>1500000){await reader.cancel();throw new AdminError('Resposta da loja acima do limite.',502);}parts.push(next.value);}
 return JSON.parse(Buffer.concat(parts).toString('utf8')) as Record<string,unknown>;
}
const record=(value:unknown):Record<string,unknown>|null=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
async function readRows(env:Env){return (await env.DB.prepare('SELECT key,value FROM settings WHERE key LIKE ? ORDER BY key').bind(prefix+'%').all<{key:string;value:string}>()).results;}
export async function listRecommendations(env:Env,privateView=false){
 const now=Date.now();const items=(await readRows(env)).map(row=>snapshotSchema.parse(JSON.parse(row.value)));
 return {items:items.filter(item=>privateView||item.state==='active').map(item=>{if(privateView)return item;const checked=recommendationCardSchema.parse(item);return {...checked,price:currentPrice(checked,now)};})};
}
async function snapshot(env:Env,id:string,catalog:boolean,link:string,token:string):Promise<Stored>{
 const detail=await api((catalog?'/products/':'/items/')+id,token);
 if(detail.id!==id)throw new AdminError('A loja retornou outro produto.',502);
 const now=new Date().toISOString();
 const catalogId=catalog?id:typeof detail.catalog_product_id==='string'&&/^MLB\d{5,20}$/.test(detail.catalog_product_id)?detail.catalog_product_id:null;
 const name=catalog?detail.name:detail.title;if(typeof name!=='string'||!name.trim())throw new AdminError('Produto sem nome na API.',502);
 const attributes=(Array.isArray(detail.attributes)?detail.attributes:[]).map(record).filter((row):row is Record<string,unknown>=>!!row);
 const wanted=['BRAND','MODEL','SCREEN_SIZE','DISPLAY_SIZE','RESOLUTION_TYPE','RAM_MEMORY','INTERNAL_MEMORY','CAPACITY','PROCESSOR_MODEL','MEMORY_TYPE'];
 const facts=attributes.filter(row=>wanted.includes(String(row.id))&&typeof row.value_name==='string').slice(0,4).map(row=>`${row.name}: ${row.value_name}`.slice(0,220));
 const pictures=Array.isArray(detail.pictures)?detail.pictures:[];
 let image:string|null=null;for(const picture of pictures){const row=record(picture);const raw=row?.secure_url??row?.url;if(typeof raw!=='string')continue;try{const url=new URL(raw);if(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.port&&/(^|\.)mlstatic\.com$/.test(url.hostname)){image=url.href;break;}}catch{}}
 let category='Tecnologia';if(typeof detail.category_id==='string'&&/^MLB\d+$/.test(detail.category_id)){try{const body=await api('/categories/'+detail.category_id,token);if(typeof body.name==='string')category=body.name.slice(0,120);}catch{}}
 let itemId=catalog?null:id;let catalogAmount:number|null=null;let catalogRegular:number|null=null;
 if(catalog){
  const winner=record(detail.buy_box_winner);if(typeof winner?.item_id==='string'&&/^MLB\d{5,20}$/.test(winner.item_id))itemId=winner.item_id;
  // O menor preço é apenas entre os anúncios retornados nesta consulta, nunca todo o marketplace.
  try{const body=await api('/products/'+id+'/items?limit=20',token);const offers=(Array.isArray(body.results)?body.results:[]).map(record).filter((row):row is Record<string,unknown>=>!!row&&typeof row.item_id==='string'&&/^MLB\d{5,20}$/.test(row.item_id)&&row.currency_id==='BRL'&&finitePrice(row.price)!==null&&row.available_quantity!==0&&(row.status===undefined||row.status==='active'));
   const best=offers.sort((a,b)=>Number(a.price)-Number(b.price))[0];if(best){itemId=String(best.item_id);catalogAmount=finitePrice(best.price);const regular=finitePrice(best.original_price);catalogRegular=regular&&catalogAmount&&regular>catalogAmount?regular:null;}
  }catch{/* Detalhes continuam úteis quando ofertas não estão autorizadas. */}
 }
 let price:RecommendationCard['price']=null;let lastError:string|null=null;
 if(itemId){try{const body=await api('/items/'+itemId+'/sale_price?context=channel_marketplace',token);const amount=body.currency_id==='BRL'?finitePrice(body.amount):null;if(amount){const regular=finitePrice(body.regular_amount);price={amountCents:amount,regularCents:regular&&regular>amount?regular:null,currency:'BRL',itemId,observedAt:now,expiresAt:new Date(Date.parse(now)+3*3600000).toISOString(),source:'sale_price',scope:catalog?'catalog_from':'linked_item'};}}catch{lastError='Preço individual indisponível na API.';}
  if(!price&&catalogAmount){price={amountCents:catalogAmount,regularCents:catalogRegular,currency:'BRL',itemId,observedAt:now,expiresAt:new Date(Date.parse(now)+3*3600000).toISOString(),source:'catalog_items',scope:'catalog_from'};lastError=null;}
 }
 return snapshotSchema.parse({id,catalogId,affiliateUrl:link,name,category,image,facts,state:detail.status==='active'?'active':'unavailable',checkedAt:now,price,lastError});
}
export async function manageRecommendations(env:Env,input:unknown){
 const action=recommendationAction.parse(input);
 if(action.action==='refresh'){await refreshRecommendations(env);return listRecommendations(env,true);}
 if(action.action==='remove'){await env.DB.prepare('DELETE FROM settings WHERE key=?').bind(prefix+action.id).run();return listRecommendations(env,true);}
 const rows=await readRows(env);if(rows.length>=24)throw new AdminError('Limite de 24 produtos. Remova um antes de adicionar outro.',409);
 const identity=await resolveMercadoLink(action.productUrl??action.link);
 const id='catalogId' in identity&&identity.catalogId?identity.catalogId:'itemId' in identity?identity.itemId:undefined;
 if(!id)throw new AdminError('O link não identificou o produto. Preencha também o endereço completo da página do produto.');
 const tracking=await resolveMercadoLink(action.link);const trackingId='catalogId' in tracking&&tracking.catalogId?tracking.catalogId:'itemId' in tracking?tracking.itemId:undefined;
 if(trackingId&&trackingId!==id)throw new AdminError('O link de afiliado aponta para outro produto.');
 const item=await snapshot(env,id,!!('catalogId' in identity&&identity.catalogId),action.link,await mercadoAccess(env));
 const key=prefix+id;if(rows.some(row=>row.key===key))throw new AdminError('Este produto já está na vitrine.',409);
 await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind(key,JSON.stringify(item)).run();return listRecommendations(env,true);
}
export async function refreshRecommendations(env:Env){
 // Seis produtos por execução limitam chamadas no plano gratuito; prioriza os mais antigos.
 const rows=(await readRows(env)).sort((a,b)=>snapshotSchema.parse(JSON.parse(a.value)).checkedAt.localeCompare(snapshotSchema.parse(JSON.parse(b.value)).checkedAt)).slice(0,6);if(!rows.length)return;
 const lock='recommendations-refresh';const owner=randomUUID();
 await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND expires<?').bind(lock,Date.now()).run();
 const claim=await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?) ON CONFLICT(key) DO NOTHING').bind(lock,'lock',owner,Date.now()+10*60000).run();if(!claim.meta.changes)throw new AdminError('A atualização já está em andamento.',409);
 try{const token=await mercadoAccess(env);for(const row of rows){const prior=snapshotSchema.parse(JSON.parse(row.value));let next:Stored;
   try{next=await snapshot(env,prior.id,prior.catalogId===prior.id,prior.affiliateUrl,token);}catch(error){next={...prior,state:error instanceof AdminError&&error.status===404?'unavailable':prior.state,price:null,checkedAt:new Date().toISOString(),lastError:'Não foi possível atualizar na loja. Tente novamente.'};}
   await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify(next),row.key,row.value).run();
  }}finally{await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND value=?').bind(lock,owner).run();}
}
