import path from 'node:path';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,rename,copyFile} from 'node:fs/promises';
import {z} from 'zod';
const image=z.object({Pic500x500:z.string().optional(),LowPic:z.string().optional(),Pic500x500Width:z.coerce.number().optional(),Pic500x500Height:z.coerce.number().optional(),LowPicWidth:z.coerce.number().optional(),LowPicHeight:z.coerce.number().optional(),IsPrivate:z.union([z.string(),z.number()]).optional(),Type:z.string().optional(),TaxonomyName:z.string().optional(),No:z.coerce.number().optional(),IsMain:z.string().optional()}).passthrough();
const media=z.object({data:z.object({Image:image.nullish(),Gallery:z.array(image).nullish()})});
export function icecatImageCandidate(input:unknown){
 const result=media.safeParse(input);if(!result.success)return null;const {Image,Gallery}=result.data.data;
 const gallery=(Gallery??[]).filter(i=>String(i.IsPrivate??'0')!=='1'&&!i.TaxonomyName&&i.Type!=='BrandLogo').sort((a,b)=>(a.IsMain==='Y'?-1:b.IsMain==='Y'?1:(a.No??0)-(b.No??0)));
 // A gallery containing only a brand logo is not a picture of the device.
 const selected=gallery[0]??(!Gallery?.length?Image:null);if(!selected||selected.Type==='BrandLogo'||String(selected.IsPrivate??'0')==='1'||selected.TaxonomyName)return null;
 const raw=selected.Pic500x500||selected.LowPic;if(!raw)return null;
 try{const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||url.port||!['images.icecat.biz','data.icecat.biz','objects.icecat.biz'].includes(url.hostname))return null;
 return {url,width:selected.Pic500x500?selected.Pic500x500Width:selected.LowPicWidth,height:selected.Pic500x500?selected.Pic500x500Height:selected.LowPicHeight};}catch{return null;}
}
// Authenticated remote URLs live only in this request. Public records contain a
// same-origin local path and public provenance, never the provider's signed URL.
export async function importIcecatImage(input:unknown,root:string,alt:string,fetcher:typeof fetch=fetch){
 const candidate=icecatImageCandidate(input);if(!candidate)return null;
 try{
  const response=await fetcher(candidate.url,{signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});if(!response.ok)return null;
  const type=response.headers.get('content-type')?.split(';')[0];const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};const ext=types[type??''];if(!ext||Number(response.headers.get('content-length')??0)>3000000)return null;
  const reader=response.body?.getReader();if(!reader)return null;const chunks:Uint8Array[]=[];let size=0;
  while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>3000000){await reader.cancel();return null;}chunks.push(next.value);}
  const bytes=Buffer.concat(chunks);const valid=ext==='jpg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:ext==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!valid)return null;
  const hash=createHash('sha256').update(bytes).digest('hex'),src=`/images/hardware/${hash}.${ext}`,target=path.join(root,'public',src);await mkdir(path.dirname(target),{recursive:true});const temp=target+'.tmp-'+process.pid;await writeFile(temp,bytes,{mode:0o644});await rename(temp,target);const exported=path.join(root,'out',src);await mkdir(path.dirname(exported),{recursive:true});await copyFile(target,exported);
  return {src,alt,width:Number.isFinite(candidate.width)&&candidate.width!>0?Math.round(candidate.width!):500,height:Number.isFinite(candidate.height)&&candidate.height!>0?Math.round(candidate.height!):500};
 }catch{return null;}
}
