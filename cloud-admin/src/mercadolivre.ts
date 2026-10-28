import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {z} from 'zod';
import {AdminError} from '../../admin/lib/config';
import {hash,equal,type Session} from './auth';
import type {Env} from './types';
import {retailerProduct} from '../../src/domain/hardware/retailers';

export const mercadoCookie='__Host-silfontech_mercadolivre';
const connectionKey='mercadolivre-connection';
const tokenSchema=z.object({access_token:z.string().min(1).max(8000),refresh_token:z.string().min(1).max(8000),expires_in:z.number().positive().max(86400)});
const recordSchema=z.object({clientId:z.string(),accessToken:z.string(),refreshToken:z.string(),expiresAt:z.number()});
export function mercadoConfigured(env:Env){return /^\d+$/.test(env.MERCADOLIVRE_CLIENT_ID??'')&&!!env.MERCADOLIVRE_CLIENT_SECRET&&/^[a-f0-9]{64}$/.test(env.MERCADOLIVRE_TOKEN_KEY??'');}
export const mercadoRedirect=(env:Env)=>env.EDITORIAL_ORIGIN+'/auth/mercadolivre/callback';
function encrypt(env:Env,value:unknown){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(env.MERCADOLIVRE_TOKEN_KEY!,'hex'),iv);cipher.setAAD(Buffer.from(connectionKey));const body=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),body].map(v=>v.toString('base64url')).join('.');}
function decrypt(env:Env,value:string){const [iv,tag,body]=value.split('.').map(v=>Buffer.from(v,'base64url'));if(!iv||!tag||!body)throw new Error('Invalid record');const cipher=createDecipheriv('aes-256-gcm',Buffer.from(env.MERCADOLIVRE_TOKEN_KEY!,'hex'),iv);cipher.setAAD(Buffer.from(connectionKey));cipher.setAuthTag(tag);return recordSchema.parse(JSON.parse(Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8')));}
async function stored(env:Env){const row=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(connectionKey).first<{value:string}>();if(!row)return null;const record=decrypt(env,row.value);return record.clientId===env.MERCADOLIVRE_CLIENT_ID?record:null;}
export async function mercadoStatus(env:Env){const configured=mercadoConfigured(env),record=configured?await stored(env):null;return {configured,connected:!!record,redirectUri:mercadoRedirect(env)};}
async function exchange(env:Env,body:URLSearchParams){body.set('client_id',env.MERCADOLIVRE_CLIENT_ID!);body.set('client_secret',env.MERCADOLIVRE_CLIENT_SECRET!);const response=await fetch('https://api.mercadolibre.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:body.toString(),redirect:'manual',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new AdminError('O Mercado Livre recusou a autorização. Confira o aplicativo e conecte novamente.',503);return tokenSchema.parse(await response.json());}
async function save(env:Env,tokens:z.infer<typeof tokenSchema>){const record={clientId:env.MERCADOLIVRE_CLIENT_ID!,accessToken:tokens.access_token,refreshToken:tokens.refresh_token,expiresAt:Date.now()+tokens.expires_in*1000};await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(connectionKey,encrypt(env,record)).run();return record;}
export async function beginMercado(env:Env,session:Session){
 if(!mercadoConfigured(env))throw new AdminError('Configure as credenciais do Mercado Livre no servidor.',503);
 const browserToken=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');
 await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?)').bind(hash(browserToken),'mercadolivre',JSON.stringify({verifier,csrfHash:hash(session.csrf),sub:session.sub,clientId:env.MERCADOLIVRE_CLIENT_ID}),Date.now()+600000).run();
 const url=new URL('https://auth.mercadolivre.com.br/authorization');url.search=new URLSearchParams({response_type:'code',client_id:env.MERCADOLIVRE_CLIENT_ID!,redirect_uri:mercadoRedirect(env),state:hash(browserToken),code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();return {browserToken,url:url.href};
}
export async function finishMercado(env:Env,session:Session,browserToken:string,state:string,code:string){
 if(!mercadoConfigured(env)||!/^[\w-]{43}$/.test(browserToken)||!equal(hash(browserToken),state)||!code||code.length>4000)throw new AdminError('Autorização inválida ou expirada.',401);
 const row=await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND kind=? AND expires>? RETURNING value').bind(hash(browserToken),'mercadolivre',Date.now()).first<{value:string}>();if(!row)throw new AdminError('Autorização expirada. Tente novamente.',401);
 const tx=JSON.parse(row.value);if(tx.sub!==session.sub||!equal(tx.csrfHash,hash(session.csrf))||tx.clientId!==env.MERCADOLIVRE_CLIENT_ID)throw new AdminError('Sessão de autorização inválida.',401);
 await save(env,await exchange(env,new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:mercadoRedirect(env),code_verifier:tx.verifier})));
}
export async function mercadoAccess(env:Env){
 if(!mercadoConfigured(env))throw new AdminError('Configure a conexão no servidor.',503);
 let record=await stored(env);if(!record)throw new AdminError('Conecte sua conta do Mercado Livre.',409);if(record.expiresAt>Date.now()+60000)return record.accessToken;
 const lock='mercadolivre-refresh';await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND expires<?').bind(lock,Date.now()).run();
 const acquired=await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?) ON CONFLICT(key) DO NOTHING').bind(lock,'lock','',Date.now()+30000).run();if(!acquired.meta.changes)throw new AdminError('A autorização está sendo atualizada. Tente novamente em instantes.',409);
 try{record=await stored(env);if(!record)throw new AdminError('Conecte sua conta.',409);if(record.expiresAt>Date.now()+60000)return record.accessToken;return (await save(env,await exchange(env,new URLSearchParams({grant_type:'refresh_token',refresh_token:record.refreshToken})))).accessToken;}finally{await env.DB.prepare('DELETE FROM auth_records WHERE key=?').bind(lock).run();}
}
export async function testMercado(env:Env){const token=await mercadoAccess(env);const response=await fetch('https://api.mercadolibre.com/users/me',{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new AdminError(response.status===401?'A autorização expirou ou foi revogada. Reconecte a conta.':'A API recusou a consulta da conta. Confira as permissões no DevCenter.',503);const body=z.object({id:z.number().int().positive()}).parse(await response.json());return {ok:true,accountId:String(body.id),message:'Conta autorizada e consulta à API confirmada. Produtos, promoções e recursos de afiliado ainda precisam de testes específicos.'};}

export async function resolveMercadoLink(raw:string){
 let current=raw;
 for(let hop=0;hop<6;hop++){
  const product=retailerProduct(current);if(product.retailer!=='mercadolivre')throw new AdminError('Use um link do Mercado Livre.');
  // IDs explícitos no link; nunca inferir anúncio a partir do título.
  const itemId=['wid','item_id'].map(key=>product.url.searchParams.get(key)).find(value=>value&&/^MLB\d{5,20}$/.test(value));
  if(itemId)return {status:200,itemId,catalogId:product.catalog?product.id:undefined};
  if(product.id)return {status:200,...(product.catalog?{catalogId:product.id}:{itemId:product.id})};
  let response=await fetch(product.url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(response.status===405){response=await fetch(product.url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000)});await response.body?.cancel();}
  if(![301,302,303,307,308].includes(response.status))return {status:response.status,resolved:false};
  const next=response.headers.get('Location');if(!next)return {status:response.status,resolved:false};
  current=new URL(next,product.url).href;
 }
 return {status:0,resolved:false};
}

export async function probeMercado(env:Env,link?:string){
 const token=await mercadoAccess(env);
 const results:{resource:string;status:number;count?:number;fields?:string[];error?:string}[]=[];
 async function get(resource:string,path:string){
  try{const response=await fetch('https://api.mercadolibre.com'+path,{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(12000)});const body=await response.json() as Record<string,unknown>;const list=Array.isArray(body)?body:Array.isArray(body.results)?body.results:Array.isArray(body.content)?body.content:null;
   results.push({resource,status:response.status,...(list?{count:list.length}:{}),...(response.ok?{fields:Object.keys(body).filter(k=>['id','title','name','pictures','price','original_price','currency_id','available_quantity','permalink','attributes','status','results','content','amount','regular_amount','metadata','paging'].includes(k))}: {error:typeof body.error==='string'?body.error.slice(0,100):'request_rejected'})});return response.ok?body:null;
  }catch{results.push({resource,status:0,error:'network_or_invalid_response'});return null;}
 }
 const linked=link?await resolveMercadoLink(link):undefined;
 if(linked){
  let itemId='itemId' in linked?linked.itemId:undefined;
  let catalogOffers:Record<string,unknown>[]=[];
  const product='catalogId' in linked&&linked.catalogId?await get('linked_catalog_product','/products/'+linked.catalogId):null;
  const winner=product?.buy_box_winner;
  if(!itemId&&winner&&typeof winner==='object'&&'item_id' in winner&&typeof winner.item_id==='string'&&/^MLB\d{5,20}$/.test(winner.item_id))itemId=winner.item_id;
  if(!itemId&&'catalogId' in linked&&linked.catalogId){const offers=await get('linked_catalog_items','/products/'+linked.catalogId+'/items?limit=5');catalogOffers=Array.isArray(offers?.results)?offers.results.map((row:Record<string,unknown>)=>Object.fromEntries(['item_id','price','original_price','currency_id','available_quantity','status','shipping','condition'].filter(key=>row[key]!==undefined).map(key=>[key,row[key]]))):[];const first=catalogOffers.find(row=>typeof row.item_id==='string'&&/^MLB\d{5,20}$/.test(row.item_id));if(first)itemId=String(first.item_id);}
  const summary=product?{name:typeof product.name==='string'?product.name:undefined,status:product.status,photos:Array.isArray(product.pictures)?product.pictures.length:0,attributes:Array.isArray(product.attributes)?product.attributes.length:0,winnerProvided:!!itemId,children:Array.isArray(product.children_ids)?product.children_ids.length:0}:undefined;
  let price:Record<string,unknown>|null=null;
  if(itemId){await get('linked_item','/items/'+itemId);price=await get('linked_sale_price','/items/'+itemId+'/sale_price?context=channel_marketplace');}
  const priceSummary=price?Object.fromEntries(['amount','regular_amount','currency_id'].filter(key=>typeof price![key]==='number'||typeof price![key]==='string').map(key=>[key,price![key]])):undefined;
  return {checkedAt:new Date().toISOString(),linkResolution:linked,productSummary:summary,priceSummary,catalogOffers,itemTest:itemId?'attempted':'no_item_identified',results,affiliateCommissions:'no_documented_endpoint_verified',affiliateLinkGeneration:'no_documented_endpoint_verified'};
 }
 const bodies=await Promise.all([
  get('account','/users/me'),get('category','/categories/MLB1055'),
  get('marketplace_search','/sites/MLB/search?category=MLB1055&q=samsung&limit=3'),
  get('catalog_search','/products/search?site_id=MLB&status=active&q=samsung&limit=3'),
  get('bestsellers','/highlights/MLB/category/MLB1055'),get('trends','/trends/MLB/MLB1055')
 ]);
 const candidates: {id:string;type?:string}[]=[];
 for(const body of bodies){if(!body)continue;for(const row of (Array.isArray(body.results)?body.results:Array.isArray(body.content)?body.content:[])){if(row&&typeof row==='object'&&typeof row.id==='string')candidates.push(row);}}
 let itemId=candidates.find(row=>/^MLB\d+$/.test(row.id)&&row.type==='ITEM')?.id;
 const products=[...candidates.filter(row=>row.type==='PRODUCT'),...(Array.isArray(bodies[3]?.results)?bodies[3].results:[])].filter(row=>typeof row.id==='string'&&/^MLB\d+$/.test(row.id)).slice(0,3);
 for(const product of products){const detail=await get('catalog_product','/products/'+product.id);const winner=detail?.buy_box_winner;if(winner&&typeof winner==='object'&&'item_id' in winner&&typeof winner.item_id==='string'&&/^MLB\d+$/.test(winner.item_id))itemId??=winner.item_id;if(itemId)break;}
 if(itemId){await get('item','/items/'+itemId);await get('sale_price','/items/'+itemId+'/sale_price');}
 return {checkedAt:new Date().toISOString(),results,affiliateCommissions:'no_documented_endpoint_verified',affiliateLinkGeneration:'no_documented_endpoint_verified',...(!itemId?{itemTest:'pending_real_item_link'}:{})};
}
