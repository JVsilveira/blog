import {z} from 'zod';
import {suggestQuote,QuoteAIError} from './quote-ai';
import {AdminError} from '../../admin/lib/config';
import {suggestTitle,titleAIStatus} from '../../admin/lib/title-ai';
import {configured,beginGoogle,finishGoogle,requireSession,readSession,checkMutation,cookie,cookies,sessionCookie,transactionCookie,revoke,equal,rateLimit} from './auth';
import {readWorkspace,mutateWorkspace} from './store';
import {lastPublish,publish} from './publish';
import {mercadoCookie,mercadoStatus,beginMercado,finishMercado,testMercado,probeMercado} from './mercadolivre';
import type {Env,Context} from './types';
import {listRecommendations,manageRecommendations,refreshRecommendations} from './recommendations';
import {discoverRecommendations,discoveredRecommendations} from './recommendation-discovery';
const security={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:security});
const redirect=(location:string,values:string[]=[])=>{const headers=new Headers({...security,Location:location});for(const c of values)headers.append('Set-Cookie',c);return new Response(null,{status:303,headers});};
async function limitedJSON(request:Request,maxBytes=512*1024){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new AdminError('Envie JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw new AdminError('Solicitação vazia.');const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>maxBytes){await reader.cancel();throw new AdminError('Conteúdo acima do limite permitido.',413);}chunks.push(part.value);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{throw new AdminError('JSON inválido.');}
}
function html(content:string){return new Response('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Área editorial | SilfonTech</title><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/assets/main.css"></head><body>'+content+'</body></html>',{headers:{...security,'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8'}});}
async function handle(request:Request,env:Env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/recommendations'&&request.method==='GET'&&(url.hostname==='api.silfontech.com.br'||url.origin===env.PUBLIC_SITE_URL)){
  const response=Response.json(await listRecommendations(env),{headers:{'Cache-Control':'public, max-age=60','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});return response;
 }
 if(path==='/api/quotes/suggest'){
  if(!quoteOrigins(env).includes(request.headers.get('Origin')??''))throw new AdminError('Origem recusada.',403);
  if(request.method==='OPTIONS')return new Response(null,{status:204});
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  await rateLimit(env,request,'quote-minute',2);
  return json(await suggestQuote(await limitedJSON(request,16384),env,request.headers.get('CF-Connecting-IP')??'unknown',request.signal));
 }
 if(request.method==='GET'&&(path.startsWith('/assets/')||path.startsWith('/brand/')||path==='/icon.svg'))return env.ASSETS.fetch(request);
 if(url.origin!==env.EDITORIAL_ORIGIN)return redirect(env.EDITORIAL_ORIGIN+(path==='/login'?'/login':'/'));
 if(path==='/internal/mercadolivre/probe'&&request.method==='POST'){
  if(!env.MERCADOLIVRE_DIAGNOSTIC_TOKEN||!equal(request.headers.get('Authorization')??'','Bearer '+env.MERCADOLIVRE_DIAGNOSTIC_TOKEN))return json({error:'Acesso recusado.'},401);
  await rateLimit(env,request,'mercado-probe',2);
  const input=request.headers.get('Content-Type')?.startsWith('application/json')?z.object({link:z.string().max(4000).optional()}).parse(await limitedJSON(request,8192)):{};
  return json(await probeMercado(env,input.link));
 }
 if(path==='/internal/recommendations'&&request.method==='POST'){
  if(!env.MERCADOLIVRE_DIAGNOSTIC_TOKEN||!equal(request.headers.get('Authorization')??'','Bearer '+env.MERCADOLIVRE_DIAGNOSTIC_TOKEN))return json({error:'Acesso recusado.'},401);
  return json(await manageRecommendations(env,await limitedJSON(request,8192)));
 }
 if(path==='/internal/recommendation-discovery'&&request.method==='POST'){
  if(!env.MERCADOLIVRE_DIAGNOSTIC_TOKEN||!equal(request.headers.get('Authorization')??'','Bearer '+env.MERCADOLIVRE_DIAGNOSTIC_TOKEN))return json({error:'Acesso recusado.'},401);
  return json(await discoverRecommendations(env));
 }
 if(path==='/internal/export'&&request.method==='GET'){
  const auth=request.headers.get('Authorization')??'';if(!env.EDITORIAL_EXPORT_TOKEN||!equal(auth,'Bearer '+env.EDITORIAL_EXPORT_TOKEN))return json({error:'Acesso recusado.'},401);
  return json({...await readWorkspace(env.DB),recommendations:await listRecommendations(env)});
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
 if(path==='/api/recommendation-discovery'&&request.method==='GET')return json(await discoveredRecommendations(env));
 if(path==='/api/recommendations'&&request.method==='GET')return json(await listRecommendations(env,true));
 if(path==='/auth/mercadolivre/callback'&&request.method==='GET'){
  const clear=cookie(mercadoCookie,'',0);
  try{await rateLimit(env,request,'mercado-callback');if(url.searchParams.has('error'))throw new AdminError('Autorização cancelada.');await finishMercado(env,session,cookies(request)[mercadoCookie]??'',url.searchParams.get('state')??'',url.searchParams.get('code')??'');return redirect('/?mercadolivre=connected',[clear]);}catch{return redirect('/?mercadolivre=error',[clear]);}
 }
 if(path==='/api/hardware/mercadolivre'&&request.method==='GET')return json(await mercadoStatus(env));
 if(path==='/api/bootstrap'&&request.method==='GET')return json({email:session.email,sub:session.sub,name:session.name,picture:session.picture,csrf:session.csrf,initial:await readWorkspace(env.DB),titleAI:titleAIStatus({EDITORIAL_AI_ENABLED:env.EDITORIAL_AI_ENABLED,GEMINI_API_KEY:env.GEMINI_API_KEY})});
 if(path==='/api/workspace'&&request.method==='GET')return json(await readWorkspace(env.DB));
 if(path==='/api/build'&&request.method==='GET')return json({job:await lastPublish(env)});
 if(request.method==='POST'){
  checkMutation(env,request,session);await rateLimit(env,request,'mutation',30);
  if(path==='/api/recommendation-discovery')return json(await discoverRecommendations(env));
  if(path==='/api/recommendations')return json(await manageRecommendations(env,await limitedJSON(request,8192)));
  if(path==='/auth/mercadolivre'){const result=await beginMercado(env,session);return jsonWithCookie({url:result.url},cookie(mercadoCookie,result.browserToken,600));}
  if(path==='/api/hardware/mercadolivre/test')return json(await testMercado(env));
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
function quoteOrigins(env:Env){return [env.PUBLIC_SITE_URL,...(env.QUOTE_ALLOWED_ORIGINS??'').split(',')].map(s=>s.trim()).filter(Boolean);}
const worker={
 async fetch(request:Request,env:Env){
  let response:Response;
  try{response=await handle(request,env);}catch(error){response=error instanceof AdminError?json({error:error.message},error.status):error instanceof z.ZodError?json({error:error.issues[0]?.message??'Confira os campos.'},400):json({error:'Não foi possível concluir a operação. Tente novamente.'},503);if(error instanceof QuoteAIError)response.headers.set('X-Quote-Failure',error.diagnostic);}
  if(new URL(request.url).pathname==='/api/quotes/suggest'&&quoteOrigins(env).includes(request.headers.get('Origin')??'')){
   response.headers.set('Access-Control-Allow-Origin',request.headers.get('Origin')!);response.headers.set('Vary','Origin');response.headers.set('Access-Control-Allow-Methods','POST, OPTIONS');response.headers.set('Access-Control-Allow-Headers','Content-Type');response.headers.set('Cache-Control','no-store');
  }return response;
 },
 async scheduled(_event:unknown,env:Env,ctx:Context){ctx.waitUntil((async()=>{
  // Sequência evita disputar a renovação do refresh token entre as duas tarefas.
  for(const task of [refreshRecommendations,discoverRecommendations]){try{await task(env);}catch{/* A próxima execução retoma; sem logs de tokens ou dados privados. */}}
  await env.DB.batch([env.DB.prepare('DELETE FROM auth_records WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM editorial_history WHERE id IN (SELECT id FROM editorial_history ORDER BY id DESC LIMIT -1 OFFSET 1000)')]);
 })());},
};

export default worker;
