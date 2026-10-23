import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {z} from 'zod';
import {AdminError} from './config';
import {equal,type Session} from './auth';
import {withWorkspaceLock} from './workspace';
export const mercadoCookie='silfontech_mercadolivre_transaction';
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const secret=()=>randomBytes(32).toString('base64url');
const connectionSchema=z.object({clientId:z.string(),accessToken:z.string().min(1),refreshToken:z.string().min(1).nullable(),expiresAt:z.number().positive()});
const pendingSchema=z.object({clientId:z.string(),redirectUri:z.string(),verifier:z.string(),sessionTag:z.string(),expiresAt:z.number()});
export function mercadoApplication(env:Record<string,string|undefined>=process.env){
 const clientId=env.MERCADOLIVRE_CLIENT_ID?.trim()||env.ML_ID_APP?.trim(),clientSecret=env.MERCADOLIVRE_CLIENT_SECRET?.trim()||env.ML_SECRET_KEY?.trim();
 return clientId&&/^\d+$/.test(clientId)&&clientSecret&&!/[\r\n]/.test(clientSecret)?{clientId,clientSecret}:null;
}
export function mercadoRedirect(origin:string,env:Record<string,string|undefined>=process.env){
 const url=new URL(env.MERCADOLIVRE_REDIRECT_URI?.trim()||origin+'/auth/mercadolivre/callback');
 if(url.origin!==origin||url.pathname!=='/auth/mercadolivre/callback'||url.search||url.hash||url.username||url.password)throw new AdminError('A URI de retorno do Mercado Livre deve ser a rota /auth/mercadolivre/callback na origem do painel.',503);
 return url.href;
}
async function stored(root:string){try{return connectionSchema.parse(JSON.parse(await readFile(path.join(root,'.editorial-admin/mercadolivre.json'),'utf8')));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}}
async function save(root:string,record:z.infer<typeof connectionSchema>){
 const file=path.join(root,'.editorial-admin/mercadolivre.json');await mkdir(path.dirname(file),{recursive:true,mode:0o700});const temp=file+'.tmp-'+process.pid;await writeFile(temp,JSON.stringify(connectionSchema.parse(record)),{mode:0o600});await rename(temp,file);
}
export async function mercadoConnected(root:string,env:Record<string,string|undefined>=process.env){
 if(env.RETAILER_IMPORT_ENABLED==='false')return false;
 if(env.MERCADOLIVRE_ACCESS_TOKEN?.trim())return env.RETAILER_IMPORT_ENABLED==='true';
 const app=mercadoApplication(env),record=await stored(root);return !!app&&record?.clientId===app.clientId&&(record.expiresAt>Date.now()||!!record.refreshToken);
}
export async function mercadoConnectionStatus(root:string,origin:string,env:Record<string,string|undefined>=process.env){return {configured:!!mercadoApplication(env),connected:await mercadoConnected(root,env),redirectUri:mercadoRedirect(origin,env),disabled:env.RETAILER_IMPORT_ENABLED==='false'};}
async function exchange(body:URLSearchParams,fetcher:typeof fetch){
 let response:Response;try{response=await fetcher('https://api.mercadolibre.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:body.toString(),redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw new AdminError('Não foi possível consultar a autorização do Mercado Livre. Tente conectar novamente.',503);}
 if(!response.ok)throw new AdminError('O Mercado Livre recusou a autorização. Confira o aplicativo, a URI de retorno e conecte novamente.',503);
 const reader=response.body?.getReader();if(!reader)throw new AdminError('Resposta de autorização vazia.',503);const parts:Uint8Array[]=[];let size=0;while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>64000){await reader.cancel();throw new AdminError('Resposta de autorização inválida.',503);}parts.push(next.value);}
 return z.object({access_token:z.string().min(1),refresh_token:z.string().min(1).nullish(),expires_in:z.number().int().positive().max(604800)}).parse(JSON.parse(Buffer.concat(parts).toString()));
}
export async function beginMercadoConnection(root:string,origin:string,session:Session,env:Record<string,string|undefined>=process.env){
 const app=mercadoApplication(env);if(!app)throw new AdminError('Configure ML_ID_APP e ML_SECRET_KEY no ambiente privado.',503);
 if(env.RETAILER_IMPORT_ENABLED==='false')throw new AdminError('A integração de lojas está desativada no servidor.',503);
 const redirectUri=mercadoRedirect(origin,env),browserToken=secret(),verifier=secret();
 const dir=path.join(root,'.editorial-admin/mercadolivre-transactions');await mkdir(dir,{recursive:true,mode:0o700});
 await writeFile(path.join(dir,hash(browserToken)+'.json'),JSON.stringify({clientId:app.clientId,redirectUri,verifier,sessionTag:hash(session.csrf),expiresAt:Date.now()+600000}),{mode:0o600,flag:'wx'});
 const url=new URL('https://auth.mercadolivre.com.br/authorization');for(const [key,value] of Object.entries({response_type:'code',client_id:app.clientId,redirect_uri:redirectUri,state:hash(browserToken),code_challenge:hashBase64(verifier),code_challenge_method:'S256',scope:'read offline_access'}))url.searchParams.set(key,value);
 return {url:url.href,browserToken};
}
const hashBase64=(text:string)=>createHash('sha256').update(text).digest('base64url');
export async function finishMercadoConnection(root:string,origin:string,session:Session,browserToken:string,state:string,code:string,env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch){
 if(!/^[A-Za-z0-9_-]{43}$/.test(browserToken)||!equal(hash(browserToken),state)||!code||code.length>4000)throw new AdminError('Autorização inválida ou expirada.',403);
 const file=path.join(root,'.editorial-admin/mercadolivre-transactions',hash(browserToken)+'.json'),claimed=file+'.claimed';await rename(file,claimed);
 let pending:z.infer<typeof pendingSchema>;try{pending=pendingSchema.parse(JSON.parse(await readFile(claimed,'utf8')));}finally{await rm(claimed,{force:true});}
 const app=mercadoApplication(env);if(!app||pending.clientId!==app.clientId||pending.redirectUri!==mercadoRedirect(origin,env)||pending.expiresAt<=Date.now()||!equal(pending.sessionTag,hash(session.csrf)))throw new AdminError('Autorização inválida ou expirada.',403);
 if(env.RETAILER_IMPORT_ENABLED==='false')throw new AdminError('Integração desativada.',503);
 await withWorkspaceLock(root,async()=>{const result=await exchange(new URLSearchParams({grant_type:'authorization_code',client_id:app.clientId,client_secret:app.clientSecret,code,redirect_uri:pending.redirectUri,code_verifier:pending.verifier}),fetcher);await save(root,{clientId:app.clientId,accessToken:result.access_token,refreshToken:result.refresh_token??null,expiresAt:Date.now()+result.expires_in*1000});});
}
export async function mercadoAccessToken(root:string,env:Record<string,string|undefined>=process.env,fetcher:typeof fetch=fetch){
 if(env.RETAILER_IMPORT_ENABLED==='false')throw new AdminError('Integração de lojas desativada.',503);
 if(env.MERCADOLIVRE_ACCESS_TOKEN?.trim()&&env.RETAILER_IMPORT_ENABLED==='true')return env.MERCADOLIVRE_ACCESS_TOKEN.trim();
 const app=mercadoApplication(env);if(!app)throw new AdminError('Configure e conecte o Mercado Livre no painel.',503);
 return withWorkspaceLock(root,async()=>{const record=await stored(root);if(!record||record.clientId!==app.clientId)throw new AdminError('Conecte sua conta do Mercado Livre no painel.',503);if(record.expiresAt>Date.now()+60000)return record.accessToken;if(!record.refreshToken)throw new AdminError('A autorização expirou. Conecte novamente o Mercado Livre.',503);
 const result=await exchange(new URLSearchParams({grant_type:'refresh_token',client_id:app.clientId,client_secret:app.clientSecret,refresh_token:record.refreshToken}),fetcher);await save(root,{clientId:app.clientId,accessToken:result.access_token,refreshToken:result.refresh_token??null,expiresAt:Date.now()+result.expires_in*1000});return result.access_token;});
}
