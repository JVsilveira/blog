import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {z} from 'zod';
import {hardwareKind,hardwareSchema,type Hardware} from '../../src/domain/hardware/contracts';
import {fetchIcecatReference,icecatReferenceSchema,icecatConfigured,IcecatError} from '../../src/lib/providers/icecat';
import {fetchIcecatIndex,indexEntrySchema} from '../../src/lib/providers/icecat-index';
import {withWorkspaceLock} from './workspace';
import {publishHardwareFeed,readInventory,expandHardware} from './hardware-feed';
import {saveHardwareLink} from './hardware-links';
import {storeLinkSchema,type StoreLink} from '../../src/domain/hardware/retailers';
import {AdminError} from './config';
const file='src/data/hardware.json';
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const privateFile=(root:string,name:string)=>path.join(root,'.editorial-admin',name);
async function privateJSON(root:string,name:string,value:unknown){await mkdir(path.join(root,'.editorial-admin'),{recursive:true,mode:0o700});const target=privateFile(root,name),temp=target+'.tmp-'+process.pid;await writeFile(temp,JSON.stringify(value),{mode:0o600});await rename(temp,target);}
async function readJSON(root:string,name:string){try{return JSON.parse(await readFile(privateFile(root,name),'utf8')) as unknown;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}}
export async function readHardware(root:string){const data=await readInventory(root);return {schemaVersion:1 as const,items:await Promise.all(data.items.map(item=>expandHardware(root,item)))};}
export async function readHardwareItem(root:string,id:string){const record=(await readInventory(root)).items.find(i=>i.id===id);return record?expandHardware(root,record):null;}
const cacheSchema=z.object({entries:z.array(indexEntrySchema),updatedAt:z.string(),scope:z.enum(['full','daily']).optional(),catalogVersion:z.number().optional(),fullUpdatedAt:z.string().optional(),removedIds:z.array(z.string())});
const requested=z.strictObject({kind:hardwareKind,reference:icecatReferenceSchema});
export type RequestedHardware=z.infer<typeof requested>;
const jobSchema=z.object({storeLink:storeLinkSchema.pick({retailer:true,href:true}).optional(),id:z.string(),state:z.enum(['queued','running','success','partial','failed']),mode:z.enum(['index','import','sync']),createdAt:z.string(),finishedAt:z.string().optional(),pid:z.number(),refresh:z.boolean().optional(),processed:z.number(),total:z.number(),results:z.array(z.object({id:z.string(),status:z.string(),message:z.string()})),message:z.string(),requests:z.array(requested)});
export type HardwareJob=z.infer<typeof jobSchema>;
export async function hardwareJob(root:string){const value=await readJSON(root,'hardware-job.json');return value?jobSchema.parse(value):null;}
export function activeHardwareJob(job:HardwareJob|null){if(!job||!['queued','running'].includes(job.state))return false;try{process.kill(job.pid,0);return Date.now()-Date.parse(job.createdAt)<45*60000;}catch{return false;}}
export async function hardwareState(root:string,query='',kind='',page=1){
 const [data,cache,job]=await Promise.all([readInventory(root),readJSON(root,'icecat-index.json'),hardwareJob(root)]);
 const index=cache?cacheSchema.parse(cache):null;
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const words=normalize(query).split(/\s+/).filter(Boolean);
 const found=(index?.entries??[]).filter(i=>(!kind||i.kind===kind)&&words.every(w=>normalize(`${i.name} ${i.productCode} ${i.icecatId}`).includes(w)));
 return {revision:digest(data),items:data.items.map(({id,kind,name,variant,modelCode,status,updatedAt,lastSyncedAt})=>({id,kind,name,variant,modelCode,status,updatedAt,lastSyncedAt})),candidates:found.slice((page-1)*50,page*50),candidateTotal:found.length,indexUpdatedAt:index?.updatedAt??null,job:job&&!activeHardwareJob(job)&&['queued','running'].includes(job.state)?{...job,state:'failed' as const,message:'A operação foi interrompida. Você pode iniciá-la novamente.'}:job,coverage:(['phone','cpu','ram'] as const).map(kind=>({kind,discovered:index?.entries.filter(i=>i.kind===kind).length??0,available:data.items.filter(i=>i.kind===kind&&i.status==='published').length})),automatic:process.env.ICECAT_AUTO_SYNC==='true',configured:icecatConfigured()};
}
function noSecrets(value:unknown){const token=process.env.ICECAT_API_TOKEN?.trim();if(token&&JSON.stringify(value).includes(token))throw new AdminError('Não inclua credenciais nos campos de produto.');}
export async function queueHardware(root:string,mode:'index'|'import'|'sync',input:unknown=[],refresh=true,storeLink?:Pick<StoreLink,'retailer'|'href'>){
 noSecrets({input,storeLink});if(storeLink)storeLink=storeLinkSchema.pick({retailer:true,href:true}).parse(storeLink);const requests=z.array(requested).max(10).parse(input);if(mode==='import'&&!requests.length)throw new AdminError('Selecione ao menos um produto.');
 if(!icecatConfigured())throw new AdminError('Integração Icecat indisponível. Confira a configuração privada.',503);
 return withWorkspaceLock(root,async()=>{if(activeHardwareJob(await hardwareJob(root)))throw new AdminError('Uma importação já está em andamento.',409);
 const job:HardwareJob={storeLink,id:randomUUID(),mode,state:'queued',createdAt:new Date().toISOString(),pid:process.pid,refresh,processed:0,total:mode==='import'?requests.length:1,requests,results:[],message:mode==='index'?'Atualização do catálogo agendada.':'Importação agendada.'};await privateJSON(root,'hardware-job.json',job);return job;});
}
const comparable=(item:Hardware)=>({kind:item.kind,name:item.name,brand:item.brand,modelCode:item.modelCode,image:item.image,deviceType:item.deviceType,specifications:item.specifications.map(({key,group,label,value,unit,displayValue})=>({key,group,label,value,unit,displayValue:displayValue??null}))});
export function mergeHardware(fresh:Hardware,prior:Hardware|undefined):{item:Hardware;status:string}{
 const now=fresh.updatedAt;
 const identity=fresh.specifications.filter(s=>/^(internal memory|internal storage capacity|internal memory type|memory layout \(modules x size\)|memory clock speed|processor socket|processor model|processor family|ram capacity)$/i.test(s.label)&&s.value!==null).slice(0,5).map(s=>`${s.label}: ${s.displayValue??s.value}${s.displayValue?'':s.unit?' '+s.unit:''}`);
 const source={...fresh.source,license:'Open Icecat Open Content License',licenseUrl:'https://iceclog.com/open-content-license/'};
 const unchanged=prior?.publication==='provider'&&prior.status==='published'&&digest(comparable(prior))===digest(comparable(fresh));
 const item=hardwareSchema.parse({...fresh,source,specifications:fresh.specifications.map(s=>({...s,source:{...s.source,license:source.license,licenseUrl:source.licenseUrl}})),createdAt:prior?.createdAt??fresh.createdAt,lastSyncedAt:now,variant:[fresh.modelCode,...identity].join(' · '),benchmarks:prior?.benchmarks??[],status:'published',publication:'provider',reviewedAt:null,reviewer:null,limitations:['Ficha técnica fornecida automaticamente pelo Icecat, sem revisão editorial. Dados disponibilizados como estão, sem garantia; confirme a compatibilidade com o fabricante.','As especificações não substituem testes de desempenho e não incluem preços atuais de lojas.']});
 return {item:unchanged?{...prior!,lastSyncedAt:now}:item,status:unchanged?'unchanged':prior?'updated':'imported'};
}
export async function activateHardware(root:string){
 return withWorkspaceLock(root,async()=>{const data=await readInventory(root);let changed=false;data.items=data.items.map(item=>{if('asset' in item)return item;if(/^icecat-(phone|cpu|ram)-[1-9]\d*$/.test(item.id)&&item.status!=='archived'&&item.publication!=='provider'){changed=true;return mergeHardware(item,item).item;}return item;});
 if(changed)await privateJSON(root,'hardware-before-automatic.json',JSON.parse(await readFile(path.join(root,file),'utf8')));
 const raw=await readJSON(root,'icecat-index.json'),cache=raw?cacheSchema.parse(raw):null;await publishHardwareFeed(root,data.items,cache?.entries??[]);return data.items.filter(i=>i.status==='published').length;
 });
}
const attemptsSchema=z.record(z.string(),z.object({at:z.string(),failed:z.boolean(),version:z.string().optional()}));
const MAX_BATCH=100,MONTHLY_LIMIT=900000;
export async function executeHardware(root:string,job:HardwareJob,deps={fetchItem:fetchIcecatReference,fetchIndex:fetchIcecatIndex}){
 try{
  if((await hardwareJob(root))?.id!==job.id)return;
  await activateHardware(root);
  job={...job,state:'running',message:'Sincronizando o catálogo gratuito do Icecat.'};await privateJSON(root,'hardware-job.json',job);
  const cacheValue=await readJSON(root,'icecat-index.json');let cache=cacheValue?cacheSchema.parse(cacheValue):null;
  if(job.mode==='index'||job.mode==='sync'){
   if(!cache||cache.catalogVersion!==2||cache.scope!=='full'||!cache.fullUpdatedAt||Date.now()-Date.parse(cache.fullUpdatedAt)>30*86400000){
    job.message='Carregando o índice completo Open Icecat. A primeira carga pode levar alguns minutos.';await privateJSON(root,'hardware-job.json',job);
    const full=await deps.fetchIndex();cache={...full,scope:'full',fullUpdatedAt:full.updatedAt};
   }else if(job.mode==='index'||job.refresh||Date.now()-Date.parse(cache.updatedAt)>86400000){
    const daily=await deps.fetchIndex(process.env,fetch,'daily'),merged=new Map(cache.entries.map(i=>[i.icecatId,i]));
    for(const id of daily.removedIds)merged.delete(id);for(const entry of daily.entries)merged.set(entry.icecatId,entry);
    cache={...cache,entries:[...merged.values()],removedIds:[...new Set([...cache.removedIds,...daily.removedIds])].filter(id=>!merged.has(id)),updatedAt:daily.updatedAt};
   }
   noSecrets(cache);await privateJSON(root,'icecat-index.json',cache);job.processed=1;
  }
  const data=await readInventory(root),attempts=attemptsSchema.parse(await readJSON(root,'icecat-attempts.json')??{});
  data.items=data.items.map(item=>{const id=/^icecat-(?:phone|cpu|ram)-(\d+)$/.exec(item.id)?.[1];if(id&&cache?.removedIds.includes(id))return {...item,status:'archived' as const};return !('asset' in item)&&id&&item.status!=='archived'&&item.publication!=='provider'?mergeHardware(item,item).item:item;});
  if(job.mode==='sync'&&cache){
   const known=new Map(data.items.map(i=>[i.id,i]));const queues=(['phone','tablet','cpu','ram'] as const).map(group=>cache!.entries.filter(entry=>{
    const kind=group==='tablet'?'phone':group;
    if(entry.kind!==kind||(kind==='phone'&&(entry.deviceType??'phone')!==group))return false;const prior=known.get(`icecat-${kind}-${entry.icecatId}`),attempt=attempts[entry.icecatId];
    if(attempt?.failed&&Date.now()-Date.parse(attempt.at)<7*86400000)return false;
    return (kind==='phone'&&(prior?.syncVersion??0)<2)||!prior||prior.status==='archived'||!prior.lastSyncedAt||Date.now()-Date.parse(prior.lastSyncedAt)>7*86400000||(!!entry.updated&&attempt?.version!==entry.updated);
   }));
   const needsPhoto=(entry:typeof cache.entries[number])=>{const prior=known.get(`icecat-${entry.kind}-${entry.icecatId}`);return !!prior&&(prior.syncVersion??0)<2;};
   queues[0]!.sort((a,b)=>Number(needsPhoto(b))-Number(needsPhoto(a)));
   const requests:RequestedHardware[]=[];while(requests.length<MAX_BATCH&&queues.some(q=>q.length))for(const q of queues){const entry=q.shift();if(entry&&requests.length<MAX_BATCH)requests.push({kind:entry.kind,reference:{icecatId:entry.icecatId}});}
   job.requests=requests;job.total=1+requests.length;await privateJSON(root,'hardware-job.json',job);
  }
  const persist=async()=>withWorkspaceLock(root,async()=>{await privateJSON(root,'icecat-attempts.json',attempts);data.items=await publishHardwareFeed(root,data.items,cache?.entries??[],Object.entries(attempts).filter(([,v])=>v.failed).map(([id])=>id));if(job.storeLink){const result=job.results.find(i=>i.status!=='failed');if(result)await saveHardwareLink(root,{...job.storeLink,hardwareId:result.id,addedAt:new Date().toISOString()});}});
  await persist();
  if(job.mode==='import'||job.mode==='sync'){
   const month=new Date().toISOString().slice(0,7),saved=await readJSON(root,'icecat-usage.json') as {month:string;count:number}|null;
   const usage={month,count:saved?.month===month&&Number.isSafeInteger(saved.count)?saved.count:0};
   for(const request of job.requests){
    if(usage.count>=MONTHLY_LIMIT){job.message='Sincronização pausada no limite mensal preventivo gratuito. O catálogo continua disponível.';break;}
    usage.count++;await privateJSON(root,'icecat-usage.json',usage);
    let id='icecatId' in request.reference?request.reference.icecatId:'productCode' in request.reference?request.reference.productCode:request.reference.gtin;let pause=false;
    try{
     const fresh=await deps.fetchItem(request.reference,request.kind,process.env,fetch,root);noSecrets(fresh);id=fresh.id;
     const record=data.items.find(i=>i.id===fresh.id),prior=record?await expandHardware(root,record):undefined,merged=mergeHardware(fresh,prior);data.items=data.items.filter(i=>i.id!==fresh.id);data.items.push(merged.item);
     job.results.push({id,status:merged.status,message:'Ficha disponível automaticamente no comparador.'});
    }catch(error){pause=error instanceof IcecatError&&error.pause;job.results.push({id,status:'failed',message:error instanceof IcecatError||error instanceof AdminError?error.message:'Não foi possível carregar a ficha; os dados anteriores foram preservados.'});}
    if('icecatId' in request.reference){const referenceId=request.reference.icecatId;attempts[referenceId]={at:new Date().toISOString(),failed:job.results.at(-1)?.status==='failed',version:cache?.entries.find(i=>i.icecatId===referenceId)?.updated};}
    job.processed++;job.message=`Atualizando automaticamente: ${job.processed}/${job.total}.`;await privateJSON(root,'hardware-job.json',job);
    if(job.processed%10===0)await persist();
    if(pause){job.message='Icecat temporariamente indisponível ou com limite de acesso. Nova tentativa automática em 15 minutos.';await privateJSON(root,'icecat-pause.json',{until:Date.now()+15*60000});break;}
   }
   await persist();
  }
  const failed=job.results.filter(r=>r.status==='failed').length;
  if(!job.message.includes('pausada')&&!job.message.includes('15 minutos'))job.message=`${data.items.filter(i=>i.status==='published').length} produtos disponíveis. ${cache?.entries.length??0} identificados no catálogo gratuito. ${failed} fichas indisponíveis neste lote. A alimentação continua automaticamente.`;
  await privateJSON(root,'hardware-job.json',{...job,state:failed?job.results.some(r=>r.status!=='failed')?'partial':'failed':'success',finishedAt:new Date().toISOString()});
 }catch(error){await privateJSON(root,'hardware-job.json',{...job,state:'failed',finishedAt:new Date().toISOString(),message:error instanceof IcecatError||error instanceof AdminError?error.message:'Operação interrompida. O catálogo anterior foi preservado.'});}
}
