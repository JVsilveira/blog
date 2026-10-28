import {OAuth2Client,LoginTicket} from 'google-auth-library';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {fixture} from './fixtures/catalog';
import worker from '../cloud-admin/src/index';
import {hash,sessionCookie,beginGoogle,finishGoogle,readSession} from '../cloud-admin/src/auth';
import {readWorkspace,mutateWorkspace} from '../cloud-admin/src/store';
import {publish,lastPublish} from '../cloud-admin/src/publish';
import {beginMercado,finishMercado,mercadoAccess,mercadoStatus,probeMercado,resolveMercadoLink} from '../cloud-admin/src/mercadolivre';
import type {Database,Statement,Env} from '../cloud-admin/src/types';
import {manageRecommendations,listRecommendations,refreshRecommendations} from '../cloud-admin/src/recommendations';
let sqlite:DatabaseSync,env:Env;
class Query implements Statement{
 values:unknown[]=[];
 constructor(readonly sql:string){}
 bind(...values:unknown[]){this.values=values;return this;}
 async first<T>(){return (sqlite.prepare(this.sql).get(...this.values as never[])??null) as T|null;}
 async all<T>(){return {results:sqlite.prepare(this.sql).all(...this.values as never[]) as T[]};}
 async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.values as never[]).changes)}};}
}
beforeEach(()=>{
 sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('cloud-admin/migrations/0001_editorial.sql','utf8'));
 const db:Database={prepare:sql=>new Query(sql),async batch(queries){sqlite.exec('BEGIN');try{const results=[];for(const q of queries){const query=q as Query;const stmt=sqlite.prepare(query.sql);if(stmt.columns().length)results.push({results:stmt.all(...query.values as never[]),meta:{changes:0}});else results.push({meta:{changes:Number(stmt.run(...query.values as never[]).changes)}});}sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 const {articles:_articles,...catalog}=fixture();void _articles;catalog.products=[];catalog.offers=[];catalog.reviews=[];
 for(const [file,value] of [['src/data/catalog.json',catalog],['docs/editorial/controle.json',{schemaVersion:1,records:[]}]])sqlite.prepare('INSERT INTO editorial_files VALUES(?,?)').run(file as string,JSON.stringify(value));
 sqlite.prepare('INSERT INTO editorial_state VALUES(1,?)').run('initial');
 env={DB:db,ASSETS:{fetch:async()=>new Response('asset')},EDITORIAL_ORIGIN:'https://editor.example.org',PUBLIC_SITE_URL:'https://example.org',EDITORIAL_ADMIN_EMAILS:'editor@example.org',GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',EDITORIAL_EXPORT_TOKEN:'export-secret',PAGES_DEPLOY_HOOK:'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/test'};
});
afterEach(()=>{sqlite.close();vi.restoreAllMocks();vi.unstubAllGlobals();});
function request(path:string,init:RequestInit={}){return new Request(env.EDITORIAL_ORIGIN+path,init);}
function session(){const secret='s'.repeat(43),value={email:'editor@example.org',sub:'subject',csrf:'csrf',expires:Date.now()+60000};sqlite.prepare('INSERT INTO auth_records VALUES(?,?,?,?)').run(hash(secret),'session',JSON.stringify(value),value.expires);return {Cookie:sessionCookie+'='+secret,Origin:env.EDITORIAL_ORIGIN,'X-CSRF-Token':'csrf','Content-Type':'application/json'};}
function article(revision='initial'){return {action:'article',revision,slug:'new-guide',title:'Guia de teste',description:'Resumo de teste',authorId:'author-test',category:'Teste',tags:[],sourceIds:['source-test'],relatedProductIds:[],methodology:'Análise sintética de teste',limitations:'Fixture não publicável',body:'## Contexto\n\nConteúdo de teste.',status:'draft',approved:false,creating:true};}
it('protege painel, bootstrap e exportação; não expõe rascunhos anonimamente',async()=>{
 expect((await worker.fetch(request('/'),env)).headers.get('Location')).toBe('/login');
 for(const path of ['/api/bootstrap','/api/workspace','/internal/export'])expect((await worker.fetch(request(path),env)).status).toBe(401);
 const response=await worker.fetch(request('/internal/export',{headers:{Authorization:'Bearer export-secret'}}),env);expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toContain('no-store');expect((await response.json()).revision).toBe('initial');
});
it('conecta Mercado Livre com PKCE e sessão vinculada, criptografa tokens e impede replay',async()=>{
 Object.assign(env,{MERCADOLIVRE_CLIENT_ID:'123',MERCADOLIVRE_CLIENT_SECRET:'test-secret',MERCADOLIVRE_TOKEN_KEY:'ab'.repeat(32)});
 const editor={email:'editor@example.org',sub:'subject',csrf:'csrf',expires:Date.now()+60000};
 const login=await beginMercado(env,editor),url=new URL(login.url);
 expect(url.searchParams.get('redirect_uri')).toBe(env.EDITORIAL_ORIGIN+'/auth/mercadolivre/callback');expect(url.searchParams.get('code_challenge_method')).toBe('S256');
 const fetcher=vi.fn(async()=>Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:21600}));vi.stubGlobal('fetch',fetcher);
 await expect(finishMercado(env,editor,login.browserToken,'wrong','code')).rejects.toMatchObject({status:401});expect(fetcher).not.toHaveBeenCalled();
 await finishMercado(env,editor,login.browserToken,url.searchParams.get('state')!,'code');
 const stored=String(sqlite.prepare('SELECT value FROM settings WHERE key=?').get('mercadolivre-connection')?.value);expect(stored).not.toContain('private-access');expect(stored).not.toContain('private-refresh');
 expect(await mercadoAccess(env)).toBe('private-access');expect(await mercadoStatus(env)).toMatchObject({connected:true});
 await expect(finishMercado(env,editor,login.browserToken,url.searchParams.get('state')!,'code')).rejects.toMatchObject({status:401});
 expect(JSON.stringify(await (await worker.fetch(request('/internal/export',{headers:{Authorization:'Bearer export-secret'}}),env)).json())).not.toContain('private-access');
});
it('protege início da conexão e teste Mercado Livre com autenticação, origem e CSRF',async()=>{
 expect((await worker.fetch(request('/api/hardware/mercadolivre'),env)).status).toBe(401);
 const headers=session();
 expect((await worker.fetch(request('/auth/mercadolivre',{method:'POST',headers:{...headers,'X-CSRF-Token':'wrong'}}),env)).status).toBe(403);
 expect((await worker.fetch(request('/api/hardware/mercadolivre/test',{method:'POST',headers:{...headers,Origin:'https://evil.example'}}),env)).status).toBe(403);
});
async function connectedMercado(){
 Object.assign(env,{MERCADOLIVRE_CLIENT_ID:'123',MERCADOLIVRE_CLIENT_SECRET:'test-secret',MERCADOLIVRE_TOKEN_KEY:'ab'.repeat(32)});
 const editor={email:'editor@example.org',sub:'subject',csrf:'csrf',expires:Date.now()+60000},login=await beginMercado(env,editor);
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:21600})));
 await finishMercado(env,editor,login.browserToken,new URL(login.url).searchParams.get('state')!,'code');
}
function recommendationProvider(){return vi.fn(async(input:RequestInfo|URL)=>{
 const path=new URL(String(input)).pathname;
 if(path==='/products/MLB123456')return Response.json({id:'MLB123456',name:'Produto sintético de teste',status:'active',pictures:[{url:'https://http2.mlstatic.com/test.jpg'}],attributes:[{id:'MODEL',name:'Modelo',value_name:'Fixture'}]});
 if(path==='/products/MLB123456/items')return Response.json({results:[{item_id:'MLB123456789',price:100,original_price:125,currency_id:'BRL'},{item_id:'MLB123456790',price:80,currency_id:'USD'},{item_id:'MLB123456791',price:50,currency_id:'BRL',available_quantity:0}]});
 return Response.json({error:'forbidden'},{status:403});
});}
it('importa card com preço real do catálogo quando sale_price é recusado, mantendo link e sem inventar review',async()=>{
 await connectedMercado();vi.stubGlobal('fetch',recommendationProvider());const link='https://www.mercadolivre.com.br/p/MLB123456?matt_tool=123#source=affiliate-profile';
 const result=await manageRecommendations(env,{action:'add',link});
 expect(result.items[0]).toMatchObject({affiliateUrl:link,price:{amountCents:10000,regularCents:12500,currency:'BRL',itemId:'MLB123456789',source:'catalog_items',scope:'catalog_from'}});
 expect((await readWorkspace(env.DB)).data.reviews).toHaveLength(0);
 const publicResponse=await worker.fetch(new Request('https://api.silfontech.com.br/api/recommendations'),env);expect(publicResponse.status).toBe(200);const serialized=await publicResponse.text();expect(serialized).not.toContain('private-access');expect(serialized).not.toContain('lastError');
 await expect(manageRecommendations(env,{action:'add',link})).rejects.toMatchObject({status:409});
});
it('oculta preços vencidos e falhas de atualização; não publica registros removidos nem vaza snapshot privado',async()=>{
 await connectedMercado();vi.stubGlobal('fetch',recommendationProvider());await manageRecommendations(env,{action:'add',link:'https://www.mercadolivre.com.br/p/MLB123456'});
 const key='recommendation:MLB123456';const row=sqlite.prepare('SELECT value FROM settings WHERE key=?').get(key);const old=JSON.parse(String(row?.value));old.price.expiresAt=new Date(Date.now()-1000).toISOString();sqlite.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify(old),key);
 expect((await listRecommendations(env)).items[0]?.price).toBeNull();
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:'unavailable'},{status:503})));await refreshRecommendations(env);expect((await listRecommendations(env)).items[0]?.price).toBeNull();
 await manageRecommendations(env,{action:'remove',id:'MLB123456'});expect((await listRecommendations(env)).items).toHaveLength(0);
});
it('recusa importação anônima, CSRF inválido e links de produtos diferentes',async()=>{
 expect((await worker.fetch(request('/api/recommendations'),env)).status).toBe(401);
 const headers=session();expect((await worker.fetch(request('/api/recommendations',{method:'POST',headers:{...headers,'X-CSRF-Token':'wrong'},body:JSON.stringify({action:'refresh'})}),env)).status).toBe(403);
 await expect(manageRecommendations(env,{action:'add',link:'https://www.mercadolivre.com.br/p/MLB123456',productUrl:'https://www.mercadolivre.com.br/p/MLB999999'})).rejects.toBeTruthy();
});
it('resolve link curto com GET quando HEAD não é aceito, sem encaminhar tokens ou aceitar outra loja',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(null,{status:405})).mockResolvedValueOnce(new Response(null,{status:302,headers:{Location:'https://www.mercadolivre.com.br/produto/p/MLB123456?wid=MLB987654321'}}));vi.stubGlobal('fetch',fetcher);
 expect(await resolveMercadoLink('https://meli.la/test')).toMatchObject({status:200,itemId:'MLB987654321',catalogId:'MLB123456'});
 expect(fetcher.mock.calls[1]?.[1]).toMatchObject({method:'GET',redirect:'manual'});expect(fetcher.mock.calls[1]?.[1]?.headers).toBeUndefined();
 fetcher.mockResolvedValueOnce(new Response(null,{status:302,headers:{Location:'https://evil.example/private'}}));
 await expect(resolveMercadoLink('https://meli.la/test')).rejects.toBeTruthy();expect(fetcher).toHaveBeenCalledTimes(3);
});
it('diagnóstico privado não confunde produto com anúncio nem devolve dados privados do provedor',async()=>{
 Object.assign(env,{MERCADOLIVRE_CLIENT_ID:'123',MERCADOLIVRE_CLIENT_SECRET:'test-secret',MERCADOLIVRE_TOKEN_KEY:'ab'.repeat(32)});
 const editor={email:'editor@example.org',sub:'subject',csrf:'csrf',expires:Date.now()+60000},login=await beginMercado(env,editor);
 vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>{
  const url=String(input);
  if(url.endsWith('/oauth/token'))return Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:21600});
  if(url.includes('/products/search'))return Response.json({results:[{id:'MLB123'}]});
  if(url.includes('/highlights/'))return Response.json({content:[{id:'MLB456',type:'PRODUCT'}]});
  if(url.includes('/items/'))throw new Error('Um ID de produto não deve virar ID de anúncio.');
  return Response.json({id:123,email:'private-email',access_token:'private-access'});
 }));
 await finishMercado(env,editor,login.browserToken,new URL(login.url).searchParams.get('state')!,'code');
 const report=await probeMercado(env);expect(report).toMatchObject({itemTest:'pending_real_item_link'});expect(report.results.some(r=>r.resource==='item')).toBe(false);
 expect(JSON.stringify(report)).not.toContain('private-email');expect(JSON.stringify(report)).not.toContain('private-access');
 expect((await worker.fetch(request('/internal/mercadolivre/probe',{method:'POST'}),env)).status).toBe(401);
});
it('renova tokens expirados e preserva criptografia do novo refresh token',async()=>{
 Object.assign(env,{MERCADOLIVRE_CLIENT_ID:'123',MERCADOLIVRE_CLIENT_SECRET:'test-secret',MERCADOLIVRE_TOKEN_KEY:'ab'.repeat(32)});
 const editor={email:'editor@example.org',sub:'subject',csrf:'csrf',expires:Date.now()+60000},login=await beginMercado(env,editor);
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({access_token:'old-access',refresh_token:'old-refresh',expires_in:1})).mockResolvedValueOnce(Response.json({access_token:'new-access',refresh_token:'new-refresh',expires_in:21600}));vi.stubGlobal('fetch',fetcher);
 await finishMercado(env,editor,login.browserToken,new URL(login.url).searchParams.get('state')!,'code');
 expect(await mercadoAccess(env)).toBe('new-access');expect(fetcher).toHaveBeenCalledTimes(2);expect(String(fetcher.mock.calls[1]?.[1]?.body)).toContain('grant_type=refresh_token');
 expect(String(sqlite.prepare('SELECT value FROM settings WHERE key=?').get('mercadolivre-connection')?.value)).not.toContain('new-refresh');
});
it('exige origem e CSRF e revoga sessão quando a conta sai da lista',async()=>{
 const headers=session();expect((await worker.fetch(request('/api/workspace',{method:'POST',headers:{...headers,Origin:'https://evil.example'},body:JSON.stringify(article())}),env)).status).toBe(403);
 expect((await worker.fetch(request('/api/workspace',{method:'POST',headers:{...headers,'X-CSRF-Token':'wrong'},body:JSON.stringify(article())}),env)).status).toBe(403);
 expect(await readSession({...env,EDITORIAL_ADMIN_EMAILS:'other@example.org'},request('/',{headers}))).toBeNull();
 expect((await worker.fetch(request('/auth/logout',{method:'POST',headers}),env)).status).toBe(200);expect(await readSession(env,request('/',{headers}))).toBeNull();
});
it('persiste rascunho, guarda histórico e impede sobrescrever revisão antiga',async()=>{
 const result=await mutateWorkspace(env.DB,article(),{email:'editor@example.org'});expect(result.data.articles[0]?.status).toBe('draft');expect(result.operations.records[0]?.reviewer).toBeNull();
 expect((await readWorkspace(env.DB)).revision).toBe(result.revision);
 await expect(mutateWorkspace(env.DB,article(),{email:'editor@example.org'})).rejects.toMatchObject({status:409});
 expect(sqlite.prepare('SELECT count(*) AS n FROM editorial_history').get()?.n).toBeGreaterThan(0);
});
it('nega publicação sem aprovação e links perigosos sem alterar banco',async()=>{
 await expect(mutateWorkspace(env.DB,{...article(),status:'published'},{email:'editor@example.org'})).rejects.toBeTruthy();
 await expect(mutateWorkspace(env.DB,{...article(),body:'[link](javascript:alert)'},{email:'editor@example.org'})).rejects.toBeTruthy();
 expect((await readWorkspace(env.DB)).data.articles).toHaveLength(0);
});
it('cria transação Google com PKCE, nonce e callback exato, sem guardar cookie em claro',async()=>{
 const login=await beginGoogle(env),url=new URL(login.url);expect(url.hostname).toBe('accounts.google.com');expect(url.searchParams.get('redirect_uri')).toBe(env.EDITORIAL_ORIGIN+'/auth/callback');expect(url.searchParams.get('code_challenge_method')).toBe('S256');expect(url.searchParams.get('nonce')).toBeTruthy();
 expect(sqlite.prepare('SELECT key FROM auth_records').get()?.key).toBe(hash(login.browserToken));
});
it('não confirma publicação antes de receber revisão pública correspondente',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>String(input).includes('api.cloudflare.com')?Response.json({success:true}):Response.json({revision:'old'})));
 const job=await publish(env);expect(job.state).toBe('queued');expect((await lastPublish(env))?.state).toBe('queued');await expect(publish(env)).rejects.toMatchObject({status:409});
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({revision:job.targetRevision})));expect((await lastPublish(env))?.state).toBe('success');
});
it('registra falha se o serviço de publicação recusar o pedido',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(null,{status:500})));await expect(publish(env)).rejects.toMatchObject({status:503});expect((await lastPublish(env))?.state).toBe('failed');
});
it('reserva publicação contra alterações concorrentes sem perder versão',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({success:true})));
 const result=await Promise.allSettled([publish(env),mutateWorkspace(env.DB,article(),{email:'editor@example.org'})]);
 expect(result.some(r=>r.status==='fulfilled')).toBe(true);
 const current=await readWorkspace(env.DB),job=await lastPublish(env);
 if(job?.state==='queued'){expect(job.targetRevision).toBe(current.revision);await expect(mutateWorkspace(env.DB,{...article(current.revision),creating:!current.data.articles.length},{email:'editor@example.org'})).rejects.toMatchObject({status:409});}
});
it('OAuth consome a transação uma única vez e recusa conta não autorizada',async()=>{
 const login=await beginGoogle(env),nonce=new URL(login.url).searchParams.get('nonce')!;
 vi.spyOn(OAuth2Client.prototype,'getToken').mockResolvedValue({tokens:{id_token:'test'},res:null} as never);
 vi.spyOn(OAuth2Client.prototype,'verifyIdToken').mockResolvedValue(new LoginTicket('envelope',{iss:'https://accounts.google.com',aud:'client',iat:1,exp:9999999999,sub:'subject',email:'other@example.org',email_verified:true,nonce}) as never);
 await expect(finishGoogle(env,login.browserToken,hash(login.browserToken),'code')).rejects.toMatchObject({status:403});
 await expect(finishGoogle(env,login.browserToken,hash(login.browserToken),'code')).rejects.toMatchObject({status:401});
 expect(sqlite.prepare("SELECT count(*) AS n FROM auth_records WHERE kind='session'").get()?.n).toBe(0);
});
it('OAuth valida nonce e e-mail confirmado antes de criar sessão privada',async()=>{
 vi.spyOn(OAuth2Client.prototype,'getToken').mockResolvedValue({tokens:{id_token:'test'},res:null} as never);
 const verify=vi.spyOn(OAuth2Client.prototype,'verifyIdToken');
 for(const mode of ['wrong-nonce','unverified','valid']){
  const login=await beginGoogle(env),nonce=new URL(login.url).searchParams.get('nonce')!;
  verify.mockResolvedValue(new LoginTicket('envelope',{iss:'https://accounts.google.com',aud:'client',iat:1,exp:9999999999,sub:'subject',email:'editor@example.org',email_verified:mode!=='unverified',nonce:mode==='wrong-nonce'?'wrong':nonce}) as never);
  const work=finishGoogle(env,login.browserToken,hash(login.browserToken),'code');
  if(mode==='valid'){const secret=await work;expect(await readSession(env,request('/',{headers:{Cookie:sessionCookie+'='+secret}}))).toMatchObject({email:'editor@example.org'});}else await expect(work).rejects.toMatchObject({status:403});
 }
});
it('HTML preserva Origin do formulário; início do login continua recusando origem null ou externa',async()=>{
 const page=await worker.fetch(request('/login'),env);
 expect(page.headers.get('Referrer-Policy')).toBe('same-origin');
 for(const origin of ['null','https://evil.example'])expect((await worker.fetch(request('/auth/google',{method:'POST',headers:{Origin:origin}}),env)).status).toBe(403);
 const response=await worker.fetch(request('/auth/google',{method:'POST',headers:{Origin:env.EDITORIAL_ORIGIN}}),env);
 expect(response.status).toBe(303);expect(new URL(response.headers.get('Location')!).hostname).toBe('accounts.google.com');
 expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
});
it('oferece CORS somente ao site público e mantém API editorial privada',async()=>{
 const origin=env.PUBLIC_SITE_URL;
 const response=await worker.fetch(request('/api/quotes/suggest',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}}),env);
 expect(response.status).toBe(204);expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(false);
 const denied=await worker.fetch(request('/api/quotes/suggest',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),env);expect(denied.status).toBe(403);expect(denied.headers.has('Access-Control-Allow-Origin')).toBe(false);
});
it('envia somente escopo técnico ao Gemini e falha sem fallback quando desativado',async()=>{
 const id=crypto.randomUUID(),body={citySize:'tiny',modality:'presencial',serviceType:'hardware',services:[{id,description:'Limpeza interna de notebook e troca de pasta térmica'}]};
 const fetcher=vi.fn(async()=>Response.json({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify({items:[{id,suggestedCents:18000,reason:'Estimativa de mão de obra, sem peças.'}],assumptions:'Confirmar condições após diagnóstico.'})}]}]}));vi.stubGlobal('fetch',fetcher);
 const req=()=>request('/api/quotes/suggest',{method:'POST',headers:{Origin:env.PUBLIC_SITE_URL,'Content-Type':'application/json'},body:JSON.stringify(body)});
 expect((await worker.fetch(req(),env)).status).toBe(503);expect(fetcher).not.toHaveBeenCalled();
 const result=await worker.fetch(req(),{...env,QUOTE_AI_ENABLED:'true',GEMINI_API_KEY:'private-test-key'});expect(result.status).toBe(200);expect((await result.json()).items[0].suggestedCents).toBe(18000);
 const sent=JSON.parse((fetcher.mock.calls as unknown as [string,RequestInit][])[0]![1].body as string);expect(JSON.parse(sent.input)).toEqual(body);expect(sent.store).toBe(false);expect(sent.tools).toBeUndefined();
});
