import {z} from 'zod';
import {AdminError} from '../../admin/lib/config';
import {suggestTitle,titleAIStatus} from '../../admin/lib/title-ai';
import {configured,beginGoogle,finishGoogle,requireSession,readSession,checkMutation,cookie,cookies,sessionCookie,transactionCookie,revoke,equal,rateLimit} from './auth';
import {readWorkspace,mutateWorkspace} from './store';
import {lastPublish,publish} from './publish';
import type {Env,Context} from './types';
const security={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:security});
const redirect=(location:string,values:string[]=[])=>{const headers=new Headers({...security,Location:location});for(const c of values)headers.append('Set-Cookie',c);return new Response(null,{status:303,headers});};
async function limitedJSON(request:Request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new AdminError('Envie JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw new AdminError('Solicitação vazia.');const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>512*1024){await reader.cancel();throw new AdminError('Conteúdo maior que 512 KB.',413);}chunks.push(part.value);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{throw new AdminError('JSON inválido.');}
}
function html(content:string){return new Response('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Área editorial | SilfonTech</title><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/assets/main.css"></head><body>'+content+'</body></html>',{headers:{...security,'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8'}});}
async function handle(request:Request,env:Env){
 const url=new URL(request.url),path=url.pathname;
 if(request.method==='GET'&&(path.startsWith('/assets/')||path.startsWith('/brand/')||path==='/icon.svg'))return env.ASSETS.fetch(request);
 if(url.origin!==env.EDITORIAL_ORIGIN)return redirect(env.EDITORIAL_ORIGIN+(path==='/login'?'/login':'/'));
 if(path==='/internal/export'&&request.method==='GET'){
  const auth=request.headers.get('Authorization')??'';if(!env.EDITORIAL_EXPORT_TOKEN||!equal(auth,'Bearer '+env.EDITORIAL_EXPORT_TOKEN))return json({error:'Acesso recusado.'},401);
  return json(await readWorkspace(env.DB));
 }
 if(path==='/auth/google'&&request.method==='POST'){
  if(request.headers.get('Origin')!==env.EDITORIAL_ORIGIN)throw new AdminError('Origem recusada.',403);
  await rateLimit(env,request,'google');const result=await beginGoogle(env);return redirect(result.url,[cookie(transactionCookie,result.browserToken,600)]);
 }
 if(path==='/auth/callback'&&request.method==='GET'){
  const clear=cookie(transactionCookie,'',0);try{
   await rateLimit(env,request,'callback');if(url.searchParams.has('error'))return redirect('/login?error=login',[clear]);
   const secret=await finishGoogle(env,cookies(request)[transactionCookie]??'',url.searchParams.get('state')??'',url.searchParams.get('code')??'');return redirect('/',[clear,cookie(sessionCookie,secret)]);
  }catch{return redirect('/login?error=login',[clear]);}
 }
 if(path==='/login'&&request.method==='GET'){
  if(await readSession(env,request))return redirect('/');
  return html('<main class="login-page"><div class="login-brand"><img class="brand-logo" src="/brand/silfontech-logo.svg" width="2050" height="470" alt="SilfonTech"></div><section class="login-panel"><h1>Seu espaço de escrita.</h1><p>Crie guias, revise suas fontes e prepare as próximas publicações.</p><form method="post" action="/auth/google"><button class="button google-button" '+(configured(env)?'':'disabled')+'>Entrar com o Google</button></form>'+(url.searchParams.has('error')?'<p role="alert">Não foi possível entrar. Confira a conta autorizada e a URI de retorno no Google.</p>':'')+'<p class="muted">Acesso exclusivo para as contas autorizadas da equipe editorial.</p></section></main>');
 }
 if(path==='/'&&request.method==='GET'){
  if(!await readSession(env,request))return redirect('/login');
  return html('<div id="root" role="status">Carregando painel…</div><script type="module" src="/assets/main.js"></script>');
 }
 const session=await requireSession(env,request);
 if(path==='/api/bootstrap'&&request.method==='GET')return json({email:session.email,sub:session.sub,name:session.name,picture:session.picture,csrf:session.csrf,initial:await readWorkspace(env.DB),titleAI:titleAIStatus({EDITORIAL_AI_ENABLED:env.EDITORIAL_AI_ENABLED,GEMINI_API_KEY:env.GEMINI_API_KEY})});
 if(path==='/api/workspace'&&request.method==='GET')return json(await readWorkspace(env.DB));
 if(path==='/api/build'&&request.method==='GET')return json({job:await lastPublish(env)});
 if(request.method==='POST'){
  checkMutation(env,request,session);await rateLimit(env,request,'mutation',30);
  if(path==='/api/workspace'){
   const job=await lastPublish(env);if(job&&['queued','running'].includes(job.state))throw new AdminError('Aguarde a publicação terminar antes de salvar.',409);
   return json(await mutateWorkspace(env.DB,await limitedJSON(request),session));
  }
  if(path==='/api/build')return json({job:await publish(env)},202);
  if(path==='/api/title')return json(await suggestTitle(await limitedJSON(request),request.signal,{EDITORIAL_AI_ENABLED:env.EDITORIAL_AI_ENABLED,GEMINI_API_KEY:env.GEMINI_API_KEY}));
  if(path==='/auth/logout'){await revoke(env,request);return jsonWithCookie({ok:true},cookie(sessionCookie,'',0));}
 }
 return json({error:'Rota não encontrada.'},404);
}
function jsonWithCookie(value:unknown,valueCookie:string){const response=json(value);response.headers.append('Set-Cookie',valueCookie);return response;}
const worker={
 async fetch(request:Request,env:Env){try{return await handle(request,env);}catch(error){if(error instanceof AdminError)return json({error:error.message},error.status);if(error instanceof z.ZodError)return json({error:error.issues[0]?.message??'Confira os campos.'},400);return json({error:'Não foi possível concluir a operação. Tente novamente.'},503);}},
 async scheduled(_event:unknown,env:Env,ctx:Context){ctx.waitUntil(env.DB.batch([env.DB.prepare('DELETE FROM auth_records WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM editorial_history WHERE id IN (SELECT id FROM editorial_history ORDER BY id DESC LIMIT -1 OFFSET 1000)')]));},
};

export default worker;
