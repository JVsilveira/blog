import {build} from 'esbuild';
import {mkdir,writeFile,cp,readdir} from 'node:fs/promises';
import path from 'node:path';
const routes=new Set<string>(['/']);
async function pages(dir:string,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.isDirectory()&&!entry.name.startsWith('['))await pages(path.join(dir,entry.name),entry.name.startsWith('(')?prefix:prefix+'/'+entry.name);
  if(entry.name==='page.tsx')routes.add(prefix||'/');
 }
}
await pages('src/app');
for(const locale of ['en','es'])for(const section of ['', '/news','/opinion','/blog',...['politics','economy','sports','technology','culture','science','world'].map(s=>'/sections/'+s)])routes.add('/'+locale+section);
for(const section of ['politics','economy','sports','technology','culture','science','world'])routes.add('/editorias/'+section);
await writeFile('cloud-admin/routes.json',JSON.stringify([...routes]));
await mkdir('cloud-admin/public/brand',{recursive:true});
await cp('public/brand/silfontech-logo.svg','cloud-admin/public/brand/silfontech-logo.svg');
await cp('public/icon.svg','cloud-admin/public/icon.svg');
await build({entryPoints:['cloud-admin/client/main.tsx'],bundle:true,minify:true,sourcemap:false,outdir:'cloud-admin/public/assets',format:'esm',target:'es2022',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},alias:{'next/navigation':path.resolve('cloud-admin/client/navigation.ts'),'next/image':path.resolve('cloud-admin/client/image.tsx')}});
console.log('Painel estático preparado; regras editoriais permanecem no servidor.');
