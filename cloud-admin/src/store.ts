import {randomUUID} from 'node:crypto';
import {validateCatalog} from '../../src/lib/catalog';
import {operationsSchema,validateOperations,markdownDestinations} from '../../src/lib/editorial-rules';
import {categorySlug,PAGE_SIZE} from '../../src/features/blog/model';
import {articleLanguages} from '../../src/features/publication/model';
import {prepareWorkspaceMutation,type Workspace} from '../../admin/lib/workspace-mutation';
import {AdminError} from '../../admin/lib/config';
import type {Database} from './types';
import allowedRoutes from '../routes.json';

export async function readWorkspace(db:Database):Promise<Workspace>{
 const [rows,stateRows]=await db.batch([db.prepare('SELECT path,contents FROM editorial_files'),db.prepare('SELECT revision FROM editorial_state WHERE id=1')]);
 const state=stateRows?.results?.[0] as {revision:string}|undefined;
 if(!state)throw new AdminError('O conteúdo inicial ainda não foi importado.',503);
 const files=new Map(((rows?.results??[]) as {path:string;contents:string}[]).map(row=>[row.path,row.contents]));
 const catalog=JSON.parse(files.get('src/data/catalog.json')??'null');
 const articles=[...files].filter(([file])=>/^src\/content\/articles\/[^/]+\/article.json$/.test(file)).map(([file,contents])=>({...JSON.parse(contents),body:files.get(file.replace('/article.json','/body.md'))??''}));
 const data=validateCatalog({...catalog,articles});
 const operations=operationsSchema.parse(JSON.parse(files.get('docs/editorial/controle.json')??'null'));
 validateOperations(operations,data);
 return {data,operations,revision:state.revision};
}
export function validateCloudLinks(workspace:Pick<Workspace,'data'>){
 const routes=new Set<string>(allowedRoutes);
 const published=workspace.data.articles.filter(a=>a.status==='published');
 for(const article of published)for(const path of Object.values(articleLanguages(article)))routes.add(path!.replace(/\/$/,'')||'/');
 for(let page=1;page<=Math.max(1,Math.ceil(published.length/PAGE_SIZE));page++)routes.add(`/ajuda/pagina/${page}`);
 for(const category of new Set(published.map(a=>a.category))){const base=`/ajuda/categoria/${categorySlug(category)}`;routes.add(base);for(let page=1;page<=Math.ceil(published.filter(a=>a.category===category).length/PAGE_SIZE);page++)routes.add(`${base}/pagina/${page}`);}
 for(const product of workspace.data.products.filter(p=>p.status!=='draft'))routes.add(`/recomendacoes/${product.slug}`);
 for(const article of workspace.data.articles.flatMap(a=>[a,...(a.translations??[]).map(t=>({...a,body:t.body}))]))for(const link of markdownDestinations(article.body)){
  if(link.image)throw new AdminError('Imagens no Markdown exigem um contrato de direitos específico.');
  if(/^#[a-zA-Z0-9_-]+$/.test(link.url))continue;
  if(/^https:/i.test(link.url)){const url=new URL(link.url);if(!url.username&&!url.password)continue;}
  if(/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(link.url)&&routes.has(link.url.replace(/\/$/,'')||'/'))continue;
  throw new AdminError('O texto contém link inválido. Use HTTPS ou uma rota pública existente.');
 }
}
export async function mutateWorkspace(db:Database,input:unknown,actor:{email:string}){
 const prior=await readWorkspace(db),next=prepareWorkspaceMutation(prior,input,actor);
 validateCloudLinks(next);
 const revision=randomUUID(),now=Date.now();
 const condition='EXISTS(SELECT 1 FROM editorial_state WHERE id=1 AND revision=?)';
 const statements=[db.prepare("UPDATE editorial_state SET revision=? WHERE id=1 AND revision=? AND NOT EXISTS(SELECT 1 FROM settings WHERE key='publication' AND json_extract(value,'$.state') IN ('queued','running'))").bind(revision,prior.revision)];
 for(const change of next.changes){
  statements.push(db.prepare(`INSERT INTO editorial_history(path,contents,revision,created_at,actor) SELECT path,contents,?,?,? FROM editorial_files WHERE path=? AND ${condition}`).bind(prior.revision,now,actor.email,change.file,revision));
  statements.push(db.prepare(`INSERT INTO editorial_files(path,contents) SELECT ?,? WHERE ${condition} ON CONFLICT(path) DO UPDATE SET contents=excluded.contents`).bind(change.file,change.contents,revision));
 }
 const result=await db.batch(statements);
 if(!result[0]?.meta.changes)throw new AdminError('O conteúdo mudou em outra aba. Recarregue antes de salvar.',409);
 return {data:next.data,operations:next.operations,revision};
}
export async function setting<T>(db:Database,key:string):Promise<T|null>{const row=await db.prepare('SELECT value FROM settings WHERE key=?').bind(key).first<{value:string}>();return row?JSON.parse(row.value):null;}
export async function saveSetting(db:Database,key:string,value:unknown){await db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(value)).run();}
