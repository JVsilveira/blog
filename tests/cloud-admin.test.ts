import {OAuth2Client,LoginTicket} from 'google-auth-library';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {fixture} from './fixtures/catalog';
import worker from '../cloud-admin/src/index';
import {hash,sessionCookie,beginGoogle,finishGoogle,readSession} from '../cloud-admin/src/auth';
import {readWorkspace,mutateWorkspace} from '../cloud-admin/src/store';
import {publish,lastPublish} from '../cloud-admin/src/publish';
import type {Database,Statement,Env} from '../cloud-admin/src/types';
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
