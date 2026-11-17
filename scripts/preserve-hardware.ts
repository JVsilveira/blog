import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {hardwareFeedSchema} from '../src/domain/hardware/feed';
import {brand} from '../src/config/brand';
import {storeLinksSchema} from '../src/domain/hardware/retailers';
import {phoneRankingSchema} from '../src/domain/hardware/bestsellers';
/** Preserva somente assets já públicos do próprio site; nunca consulta o fornecedor. */
export async function preserveHardware(root=process.cwd(),request:typeof fetch=fetch){
 try{await Promise.all(['phone','cpu','ram','links','bestsellers'].map(kind=>readFile(path.join(root,`public/data/hardware/${kind}.json`))));return;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const feeds=new Map<string,Uint8Array>(),files=new Set<string>();let bytes=0;
 async function download(file:string){
  if(!/^\/(?:data\/hardware\/[a-zA-Z0-9_-]+\.json|images\/hardware\/[a-f0-9]{64}\.(?:jpg|png|webp))$/.test(file))throw Error('Caminho de catálogo público inválido.');
  const r=await request(new URL(file,brand.origin),{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error('Não foi possível preservar o catálogo público. Build interrompido para evitar remover comparadores.');
  const data=new Uint8Array(await r.arrayBuffer());bytes+=data.length;
  if(data.length>24*1024*1024||bytes>768*1024*1024)throw Error('Catálogo excede orçamento de preservação.');
  return data;
 }
 for(const kind of ['phone','cpu','ram']){
  const file=`/data/hardware/${kind}.json`,body=await download(file),feed=hardwareFeedSchema.parse(JSON.parse(new TextDecoder().decode(body)));feeds.set(file,body);
  for(const item of feed.items){files.add(item.asset.split('#')[0]!);if(item.image)files.add(item.image.src);}
 }
 for(const [name,schema] of [['links',storeLinksSchema],['bestsellers',phoneRankingSchema]] as const){const file=`/data/hardware/${name}.json`,body=await download(file);schema.parse(JSON.parse(new TextDecoder().decode(body)));feeds.set(file,body);}
 if(files.size>18000)throw Error('Catálogo excede orçamento de arquivos.');
 const queue=[...files];let cursor=0;
 await Promise.all(Array.from({length:8},async()=>{while(cursor<queue.length){const file=queue[cursor++]!,data=await download(file),target=path.join(root,'public',file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);}}));
 // Manifests por último: arquivos parciais não são aceitos como catálogo completo.
 for(const [file,body] of feeds){const target=path.join(root,'public',file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,body);}
 console.log(`Catálogo público preservado: ${files.size} arquivos existentes, sem consulta ao Icecat.`);
}
