import {mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {validateCatalog} from '../src/lib/catalog';
import {operationsSchema,validateOperations} from '../src/lib/editorial-rules';
import {z} from 'zod';
import {recommendationFeedSchema} from '../src/domain/recommendation-feed';
export async function importCloudEditorial(env:Partial<NodeJS.ProcessEnv>,root=process.cwd()){
 if(!env.EDITORIAL_EXPORT_URL)return;
 if(!env.EDITORIAL_EXPORT_TOKEN)throw new Error('Configure o token privado de exportação editorial no ambiente do build.');
 const url=new URL(env.EDITORIAL_EXPORT_URL);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/internal/export'||url.search||url.hash)throw new Error('Origem da exportação editorial inválida.');
 const response=await fetch(url,{headers:{Authorization:'Bearer '+env.EDITORIAL_EXPORT_TOKEN},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('O painel não liberou a exportação editorial. Confira a configuração privada.');
 const reader=response.body?.getReader();if(!reader)throw new Error('Exportação vazia.');const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16*1024*1024){await reader.cancel();throw new Error('Exportação editorial acima de 16 MB.');}chunks.push(part.value);}
 const payload=z.object({data:z.unknown(),operations:operationsSchema,revision:z.string().min(1).max(100),recommendations:recommendationFeedSchema.default({items:[]})}).parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
 const data=validateCatalog(payload.data);validateOperations(payload.operations,data);
 const articles=path.join(root,'src/content/articles');await rm(articles,{recursive:true,force:true});await mkdir(articles,{recursive:true});
 for(const article of data.articles){const folder=path.join(articles,article.slug);await mkdir(folder,{recursive:true});const {body,...metadata}=article;await writeFile(path.join(folder,'article.json'),JSON.stringify(metadata,null,2)+'\n');await writeFile(path.join(folder,'body.md'),body+'\n');}
 const {articles:_articles,...catalog}=data;void _articles;
 await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 await writeFile(path.join(root,'src/data/recommendations.json'),JSON.stringify(payload.recommendations,null,2)+'\n');
 await mkdir(path.join(root,'docs/editorial'),{recursive:true});await writeFile(path.join(root,'docs/editorial/controle.json'),JSON.stringify(payload.operations,null,2)+'\n');
 await mkdir(path.join(root,'public/data'),{recursive:true});await writeFile(path.join(root,'public/data/editorial-version.json'),JSON.stringify({revision:payload.revision}));
 console.log('Conteúdo editorial recebido por canal autenticado. Rascunhos continuam excluídos do site público.');
}
