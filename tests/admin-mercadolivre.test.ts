import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {beginMercadoConnection,finishMercadoConnection,mercadoAccessToken,mercadoConnectionStatus,mercadoRedirect} from '../admin/lib/mercadolivre';
import {retailerReference,connectedRetailerStatus} from '../admin/lib/retailers';
const roots:string[]=[];
const env={ML_ID_APP:'123456789',ML_SECRET_KEY:'private-fixture-secret'};
const origin='https://editor.example.org';
const session={email:'editor@example.org',sub:'fixture',csrf:'a'.repeat(43),expires:Date.now()+3600000};
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
async function root(){const dir=await mkdtemp(path.join(tmpdir(),'mercado-test-'));roots.push(dir);return dir;}
const tokens=(expires=3600)=>new Response(JSON.stringify({access_token:'private-access',refresh_token:'private-refresh',expires_in:expires}));
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(roots.splice(0).map(dir=>rm(dir,{recursive:true,force:true})));});
it('inicia OAuth com state, PKCE e arquivo privado; não envia o segredo ao navegador',async()=>{
 const dir=await root();expect(mercadoRedirect(origin,{MERCADOLIVRE_REDIRECT_URI:''})).toBe(origin+'/auth/mercadolivre/callback');
 expect(()=>mercadoRedirect(origin,{MERCADOLIVRE_REDIRECT_URI:'https://other.example.org/auth/mercadolivre/callback'})).toThrow();
 const pending=await beginMercadoConnection(dir,origin,session,env),url=new URL(pending.url);
 expect(url.origin).toBe('https://auth.mercadolivre.com.br');expect(url.searchParams.get('client_id')).toBe(env.ML_ID_APP);
 expect(url.searchParams.get('state')).toBe(digest(pending.browserToken));expect(url.searchParams.get('code_challenge_method')).toBe('S256');expect(pending.url).not.toContain(env.ML_SECRET_KEY);
 const file=path.join(dir,'.editorial-admin/mercadolivre-transactions',digest(pending.browserToken)+'.json');
 const transaction=JSON.parse(await readFile(file,'utf8'));expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(transaction.verifier).digest('base64url'));expect((await stat(file)).mode&0o777).toBe(0o600);
 expect(await mercadoConnectionStatus(dir,origin,env)).toEqual({configured:true,connected:false,redirectUri:origin+'/auth/mercadolivre/callback',disabled:false});
});
it('troca código uma vez, guarda tokens privados e usa a autorização para identificar RAM sem alterar o link',async()=>{
 const dir=await root(),pending=await beginMercadoConnection(dir,origin,session,env),url=new URL(pending.url),fetcher=vi.fn<typeof fetch>().mockResolvedValue(tokens());
 await finishMercadoConnection(dir,origin,session,pending.browserToken,url.searchParams.get('state')!,'fixture-code',env,fetcher);
 const sent=new URLSearchParams(fetcher.mock.calls[0]![1]!.body as string);expect(sent.get('grant_type')).toBe('authorization_code');expect(sent.get('client_secret')).toBe(env.ML_SECRET_KEY);expect(sent.get('code_verifier')).toHaveLength(43);
 expect(await mercadoAccessToken(dir,env,fetcher)).toBe('private-access');expect(fetcher).toHaveBeenCalledTimes(1);
 expect((await stat(path.join(dir,'.editorial-admin/mercadolivre.json'))).mode&0o777).toBe(0o600);
 expect(await connectedRetailerStatus({...env,EDITORIAL_ROOT:dir})).toEqual({amazon:false,mercadolivre:true});
 await expect(finishMercadoConnection(dir,origin,session,pending.browserToken,url.searchParams.get('state')!,'fixture-code',env,fetcher)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
 const itemFetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({id:'MLB123456789',status:'active',attributes:[{id:'BRAND',value_name:'Fixture'},{id:'MPN',value_name:'RAM-16'}]})));
 const href='https://produto.mercadolivre.com.br/MLB-123456789-memoria-_JM';
 expect(await retailerReference(href,{...env,EDITORIAL_ROOT:dir},itemFetcher)).toMatchObject({href,productId:'MLB123456789',catalog:false,reference:{brand:'Fixture',productCode:'RAM-16'}});
 expect(itemFetcher.mock.calls[0]![1]!.headers).toEqual({Authorization:'Bearer private-access'});
});
it('rejeita state, sessão e transação expirada antes de consultar o provedor',async()=>{
 const dir=await root(),fetcher=vi.fn<typeof fetch>();
 const begin=()=>beginMercadoConnection(dir,origin,session,env);
 let pending=await begin();
 await expect(finishMercadoConnection(dir,origin,session,pending.browserToken,'bad-state','code',env,fetcher)).rejects.toThrow();
 await expect(finishMercadoConnection(dir,origin,{...session,csrf:'b'.repeat(43)},pending.browserToken,digest(pending.browserToken),'code',env,fetcher)).rejects.toThrow();
 pending=await begin();const file=path.join(dir,'.editorial-admin/mercadolivre-transactions',digest(pending.browserToken)+'.json');const record=JSON.parse(await readFile(file,'utf8'));await writeFile(file,JSON.stringify({...record,expiresAt:1}));
 await expect(finishMercadoConnection(dir,origin,session,pending.browserToken,digest(pending.browserToken),'code',env,fetcher)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
});
it('renova e rotaciona tokens no servidor, respeita desligamento e oculta erros do provedor',async()=>{
 const dir=await root(),pending=await beginMercadoConnection(dir,origin,session,env),fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(tokens(1)).mockResolvedValueOnce(new Response(JSON.stringify({access_token:'rotated-access',refresh_token:'rotated-refresh',expires_in:3600})));
 await finishMercadoConnection(dir,origin,session,pending.browserToken,digest(pending.browserToken),'code',env,fetcher);
 expect(await mercadoAccessToken(dir,env,fetcher)).toBe('rotated-access');expect(new URLSearchParams(fetcher.mock.calls[1]![1]!.body as string).get('refresh_token')).toBe('private-refresh');
 const record=JSON.parse(await readFile(path.join(dir,'.editorial-admin/mercadolivre.json'),'utf8'));expect(record.refreshToken).toBe('rotated-refresh');
 await expect(mercadoAccessToken(dir,{...env,RETAILER_IMPORT_ENABLED:'false'},fetcher)).rejects.toThrow('desativada');
 expect(await mercadoAccessToken(dir,{RETAILER_IMPORT_ENABLED:'true',MERCADOLIVRE_ACCESS_TOKEN:'manual'})).toBe('manual');
 const other=await beginMercadoConnection(dir,origin,session,env);fetcher.mockResolvedValueOnce(new Response('private-secret-provider-details',{status:400}));
 await expect(finishMercadoConnection(dir,origin,session,other.browserToken,digest(other.browserToken),'code',env,fetcher)).rejects.toThrow('recusou a autorização');
});
