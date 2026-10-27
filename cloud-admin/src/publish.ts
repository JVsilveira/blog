import {randomUUID} from 'node:crypto';
import type {Env} from './types';
import {setting,readWorkspace} from './store';
import {AdminError} from '../../admin/lib/config';
import type {BuildJob} from '../../admin/lib/build';
type Job=BuildJob&{targetRevision:string};
export async function lastPublish(env:Env){
 const job=await setting<Job>(env.DB,'publication');if(!job||!['queued','running'].includes(job.state))return job;
 const before=JSON.stringify(job);
 const persist=()=>env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify(job),'publication',before).run();
 try{
  const response=await fetch(env.PUBLIC_SITE_URL+'/data/editorial-version.json?revision='+encodeURIComponent(job.targetRevision),{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'Cache-Control':'no-cache'}});
  if(response.ok&&(await response.json() as {revision?:string}).revision===job.targetRevision){job.state='success';job.finishedAt=new Date().toISOString();job.message='A nova versão foi confirmada no site público.';await persist();}
 }catch{/* Uma próxima consulta pode confirmar a entrega. */}
 if(Date.now()-Date.parse(job.startedAt)>15*60000&&job.state==='queued'){job.state='failed';job.finishedAt=new Date().toISOString();job.message='O site ainda não confirmou esta versão. Confira o build no Cloudflare Pages.';await persist();}
 return setting<Job>(env.DB,'publication');
}
export async function publish(env:Env){
 if(!env.PAGES_DEPLOY_HOOK)throw new AdminError('A publicação ainda não foi vinculada ao Pages.',503);
 const prior=await lastPublish(env);if(prior&&(['queued','running'].includes(prior.state)||Date.now()-Date.parse(prior.startedAt)<60000))throw new AdminError('Já existe uma publicação em andamento. Aguarde.',409);
 const workspace=await readWorkspace(env.DB);
 const job:Job={id:randomUUID(),state:'queued',startedAt:new Date().toISOString(),finishedAt:null,message:'Publicação solicitada. Aguardando o Cloudflare concluir o build.',targetRevision:workspace.revision};
 // Reserva atômica impede duas publicações concorrentes.
 const value=JSON.stringify(job),previous=prior?JSON.stringify(prior):null;
 const claim=await env.DB.prepare('INSERT INTO settings(key,value) SELECT ?,? WHERE EXISTS(SELECT 1 FROM editorial_state WHERE id=1 AND revision=?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE settings.value=?').bind('publication',value,workspace.revision,previous).run();
 if(!claim.meta.changes)throw new AdminError('Outra publicação começou. Atualize a página.',409);
 try{
  const url=new URL(env.PAGES_DEPLOY_HOOK);if(url.protocol!=='https:'||url.hostname!=='api.cloudflare.com')throw new Error('Hook inválido');
  const response=await fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Publicação recusada');
 }catch{job.state='failed';job.finishedAt=new Date().toISOString();job.message='Não foi possível acionar o build. Tente novamente mais tarde.';await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify(job),'publication',value).run();throw new AdminError(job.message,503);}
 return job;
}
