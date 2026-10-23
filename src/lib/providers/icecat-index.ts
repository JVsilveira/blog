import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import { z } from 'zod';
import { hardwareKind } from '../../domain/hardware/contracts';
import { IcecatError,icecatConfigured } from './icecat';
export const indexEntrySchema=z.strictObject({icecatId:z.string().regex(/^[1-9]\d{0,14}$/),kind:hardwareKind,deviceType:z.enum(['phone','tablet']).optional(),name:z.string().min(1).max(2000),productCode:z.string().max(300),supplierId:z.string().max(50),updated:z.string().max(100).optional()});
export type IndexEntry=z.infer<typeof indexEntrySchema>;
// Category IDs verified against official Product JSON/reference catalogue.
const categories:Record<string,'phone'|'cpu'|'ram'>={'119':'phone','897':'phone','1893':'phone','989':'cpu','911':'ram'};
const decode=(s:string)=>s.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi,entity=>{
 const fixed:Record<string,string>={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};if(fixed[entity])return fixed[entity];const n=entity.startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';
});
// Scan only file attributes; never resolve DTDs, entities, URLs or external XML.
export class IndexScanner {
 private buffer='';entries:IndexEntry[]=[];removedIds:string[]=[];private ids=new Set<string>();
 push(chunk:string){this.buffer+=chunk;
  while(true){const start=this.buffer.search(/<file\s/);if(start<0){this.buffer=this.buffer.slice(-8);return;}this.buffer=this.buffer.slice(start);let quote='';let end=-1;
   for(let i=5;i<this.buffer.length;i++){const c=this.buffer[i]!;if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='>'){end=i;break;}}
   if(end<0){if(this.buffer.length>65536)throw new IcecatError('Registro de índice acima do limite.');return;}
   const attrs:Record<string,string>={};for(const m of this.buffer.slice(0,end).matchAll(/([\w.-]+)\s*=\s*(["'])(.*?)\2/gs))attrs[m[1]!]=decode(m[3]!);this.buffer=this.buffer.slice(end+1);
   const kind=categories[attrs.Catid??''];if(!kind)continue;
   const id=attrs.Product_ID&&attrs.Product_ID!=='0'?attrs.Product_ID:/(\d+)\.xml(?:\?.*)?$/.exec(attrs.path??'')?.[1];if(!id||!/^\d+$/.test(id)||this.ids.has(id))continue;
   this.ids.add(id);if(attrs.Quality==='REMOVED'){this.removedIds.push(id);continue;}if(attrs.Limited==='Yes'||attrs.Quality==='NOEDITOR')continue;
   if(this.entries.length>=500000)throw new IcecatError('Índice excedeu o limite de segurança de 500 mil produtos nas categorias.');
   const item=indexEntrySchema.safeParse({icecatId:id,kind,...(kind==='phone'?{deviceType:attrs.Catid==='897'?'tablet':'phone'}:{}),name:attrs.Model_Name||attrs.Prod_ID||id,productCode:attrs.Prod_ID??'',supplierId:attrs.Supplier_id??'',updated:attrs.Updated??''});if(item.success)this.entries.push(item.data);
  }
 }
}
export async function fetchIcecatIndex(env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch,scope:'full'|'daily'='full'){
 if(!icecatConfigured(env))throw new IcecatError('Configure a integração Icecat no servidor.');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20*60000);
 let input:Readable|undefined,decoded:Readable|undefined;
 try{
  const response=await fetcher(`https://data.icecat.biz/export/freexml/EN/${scope==='full'?'files':'daily'}.index.xml.gz`,{headers:{'api-token':env.ICECAT_API_TOKEN!.trim()},signal:controller.signal,redirect:'error',cache:'no-store'});
  if(!response.ok||!response.body)throw new IcecatError('Índice Icecat indisponível para a conta. Tente buscar por marca e código.');
  input=Readable.fromWeb(response.body as import('node:stream/web').ReadableStream<Uint8Array>);let compressed=0;input.on('data',b=>{compressed+=b.length;if(compressed>600000000)controller.abort();});
  decoded=input.pipe(createGunzip());input.on('error',error=>decoded?.destroy(error));const parser=new IndexScanner(),decoder=new TextDecoder();let size=0;
  for await(const chunk of decoded){size+=chunk.length;if(size>6000000000)throw new IcecatError('Índice acima do limite de segurança de processamento.');parser.push(decoder.decode(chunk,{stream:true}));}
  parser.push(decoder.decode());if(!parser.entries.length&&!parser.removedIds.length)throw new IcecatError('Índice vazio ou inválido; catálogo anterior preservado.');if(JSON.stringify(parser.entries).includes(env.ICECAT_API_TOKEN!.trim()))throw new IcecatError('Índice contém informação privada e foi recusado.');return {scope,catalogVersion:2,entries:parser.entries,removedIds:parser.removedIds,updatedAt:new Date().toISOString()};
 }catch(error){if(error instanceof IcecatError)throw error;throw new IcecatError('Não foi possível atualizar o catálogo de busca Icecat. A lista anterior foi preservada.');}
 finally{clearTimeout(timer);decoded?.destroy();input?.destroy();controller.abort();}
}
