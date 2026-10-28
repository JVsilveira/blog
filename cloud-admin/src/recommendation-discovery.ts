import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {mercadoAccess} from './mercadolivre';
import {recommendationApi,snapshotRecommendation} from './recommendations';
import {recommendationCardSchema,mercadoLink,currentPrice,discountPercent} from '../../src/domain/recommendation-feed';
import {AdminError} from '../../admin/lib/config';
import type {Env} from './types';

// A descoberta não fornece atribuição de afiliado. Seus resultados ficam privados.
const candidateSchema=recommendationCardSchema.omit({affiliateUrl:true}).extend({productUrl:mercadoLink,foundAt:z.iso.datetime(),searchTerm:z.string()});
const stateSchema=z.object({cursor:z.number().int().min(0),lastRun:z.string().nullable(),lastAdded:z.number().int().nonnegative(),error:z.string().nullable()});
const stateKey='recommendation-discovery';
const prefix='recommendation-candidate:';
const sources:{query:string;label:string;expectedDomain?:string}[]=[
 {query:'smartphone',label:'Celulares'},
 {query:'smart tv',label:'TVs'},
 {query:'notebook',label:'Notebooks'},
 {query:'monitor',label:'Monitores'},
 {query:'ssd',label:'Armazenamento'},
 {query:'memoria ram',label:'Memória RAM'},
 {query:'processador para computador',label:'Processadores',expectedDomain:'MLB-COMPUTER_PROCESSORS'},
 {query:'headset',label:'Áudio'},
];
async function readState(env:Env){const row=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(stateKey).first<{value:string}>();return row?stateSchema.parse(JSON.parse(row.value)):{cursor:0,lastRun:null,lastAdded:0,error:null};}
export async function discoveredRecommendations(env:Env){
 const [state,rows,linked]=await Promise.all([
  readState(env),
  env.DB.prepare('SELECT value FROM settings WHERE key LIKE ?').bind(prefix+'%').all<{value:string}>(),
  env.DB.prepare('SELECT key FROM settings WHERE key LIKE ?').bind('recommendation:%').all<{key:string}>(),
 ]);
 const linkedIds=new Set(linked.results.map(row=>row.key.slice('recommendation:'.length)));
 const now=Date.now();const items=rows.results.map(row=>candidateSchema.parse(JSON.parse(row.value))).filter(item=>item.state==='active'&&!linkedIds.has(item.id)).map(item=>{
  const card={...item,affiliateUrl:item.productUrl};return {...item,price:currentPrice(card,now),discount:discountPercent(card,now),affiliateReady:false as const};
 }).sort((a,b)=>b.discount-a.discount||b.checkedAt.localeCompare(a.checkedAt));
 return {items,state,publication:'requires_affiliate_link' as const};
}
export async function discoverRecommendations(env:Env){
 const lock='recommendation-discovery-lock',owner=randomUUID();
 await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND expires<?').bind(lock,Date.now()).run();
 const acquired=await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?) ON CONFLICT(key) DO NOTHING').bind(lock,'lock',owner,Date.now()+10*60000).run();
 if(!acquired.meta.changes)throw new AdminError('A busca automática já está em andamento.',409);
 const state=await readState(env);let added=0;
 try{
  const token=await mercadoAccess(env),source=sources[state.cursor%sources.length]!;
  let ranked:unknown[]=[];
  try{
   const prediction=await recommendationApi('/sites/MLB/domain_discovery/search?limit=1&q='+encodeURIComponent(source.query),token);
   const category=Array.isArray(prediction)?prediction[0]?.category_id:undefined;
   if(typeof category==='string'&&/^MLB\d+$/.test(category)){
    const highlights=await recommendationApi('/highlights/MLB/category/'+category,token);
    if(Array.isArray(highlights.content))ranked=highlights.content.filter((row:unknown)=>row&&typeof row==='object'&&'type' in row&&row.type==='PRODUCT');
   }
  }catch{/* Busca de catálogo continua quando o ranking não estiver liberado. */}
  const result=await recommendationApi('/products/search?site_id=MLB&status=active&limit=6&q='+encodeURIComponent(source.query),token);
  const rows=await env.DB.prepare('SELECT key,value FROM settings WHERE key LIKE ? OR key LIKE ?').bind(prefix+'%','recommendation:%').all<{key:string;value:string}>();
  const candidates=new Map(rows.results.filter(row=>row.key.startsWith(prefix)).map(row=>{const candidate=candidateSchema.parse(JSON.parse(row.value));return [candidate.id,candidate];}));
  const linkedIds=new Set(rows.results.filter(row=>row.key.startsWith('recommendation:')).map(row=>row.key.slice('recommendation:'.length)));
  const raw=[...ranked,...(Array.isArray(result.results)?result.results:[])];
  const ids=[...new Set(raw.flatMap((row:unknown)=>{if(!row||typeof row!=='object'||!('id' in row)||typeof row.id!=='string'||!/^MLB\d{5,20}$/.test(row.id))return [];return [row.id];}))].filter(id=>!linkedIds.has(id)&&(!candidates.has(id)||Date.now()-Date.parse(candidates.get(id)!.checkedAt)>6*3600000)).slice(0,3);
  for(const id of ids){try{
   const productUrl='https://www.mercadolivre.com.br/p/'+id;
   const snapshot=await snapshotRecommendation(env,id,true,productUrl,token);
   if(source.expectedDomain&&snapshot.providerDomain!==source.expectedDomain)continue;
   if(snapshot.state!=='active'||!snapshot.image||!currentPrice(snapshot,Date.now()))continue;
   const {affiliateUrl:_affiliate,lastError:_error,...product}=snapshot;void _affiliate;void _error;
   const candidate=candidateSchema.parse({...product,category:source.label,productUrl,foundAt:candidates.get(id)?.foundAt??new Date().toISOString(),searchTerm:source.query});
   await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(prefix+id,JSON.stringify(candidate)).run();added++;
  }catch{/* Um candidato indisponível não impede as próximas categorias. */}}
  // Mantém no máximo 48 candidatos; preços antigos são ocultados na leitura.
  await env.DB.prepare("DELETE FROM settings WHERE key IN (SELECT key FROM settings WHERE key LIKE ? ORDER BY json_extract(value,'$.checkedAt') DESC LIMIT -1 OFFSET 48)").bind(prefix+'%').run();
  await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(stateKey,JSON.stringify({cursor:state.cursor+1,lastRun:new Date().toISOString(),lastAdded:added,error:null})).run();
 }catch(error){
  await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(stateKey,JSON.stringify({...state,lastRun:new Date().toISOString(),lastAdded:0,error:'Não foi possível consultar novas oportunidades. A busca será retomada automaticamente.'})).run();throw error;
 }finally{await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND value=?').bind(lock,owner).run();}
 return discoveredRecommendations(env);
}
