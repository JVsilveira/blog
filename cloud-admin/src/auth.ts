import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {OAuth2Client,CodeChallengeMethod} from 'google-auth-library';
import {AdminError} from '../../admin/lib/config';
import type {Env} from './types';
export const sessionCookie='__Host-silfontech_editor';
export const transactionCookie='__Host-silfontech_google';
const random=()=>randomBytes(32).toString('base64url');
export const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export const equal=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export type Session={email:string;sub:string;name?:string;picture?:string;csrf:string;expires:number};
const allowlist=(env:Env)=>(env.EDITORIAL_ADMIN_EMAILS??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const client=(env:Env)=>new OAuth2Client(env.GOOGLE_CLIENT_ID,env.GOOGLE_CLIENT_SECRET,env.EDITORIAL_ORIGIN+'/auth/callback');
export function configured(env:Env){return !!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET&&allowlist(env).length>0&&new URL(env.EDITORIAL_ORIGIN).protocol==='https:';}
export function cookie(name:string,value:string,age=28800){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;}
export function cookies(request:Request){return Object.fromEntries((request.headers.get('Cookie')??'').split(';').map(p=>p.trim().split('=').slice(0,2)));}
export async function readSession(env:Env,request:Request):Promise<Session|null>{
 const secret=cookies(request)[sessionCookie];if(!secret||!/^[\w-]{43}$/.test(secret))return null;
 const row=await env.DB.prepare('SELECT value FROM auth_records WHERE key=? AND kind=? AND expires>?').bind(hash(secret),'session',Date.now()).first<{value:string}>();
 if(!row)return null;const session=JSON.parse(row.value) as Session;
 return session.expires>Date.now()&&allowlist(env).includes(session.email)?session:null;
}
export async function requireSession(env:Env,request:Request){const session=await readSession(env,request);if(!session)throw new AdminError('Entre novamente para continuar.',401);return session;}
export function checkMutation(env:Env,request:Request,session:Session){
 if(request.headers.get('Origin')!==env.EDITORIAL_ORIGIN||!equal(request.headers.get('X-CSRF-Token')??'',session.csrf))throw new AdminError('Atualize a página e tente novamente.',403);
}
export async function beginGoogle(env:Env){
 if(!configured(env))throw new AdminError('Configure o login Google no servidor.',503);
 const browserToken=random(),nonce=random(),oauth=client(env),verifier=await oauth.generateCodeVerifierAsync();
 await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?)').bind(hash(browserToken),'google',JSON.stringify({nonce,verifier:verifier.codeVerifier}),Date.now()+600000).run();
 const url=new URL(oauth.generateAuthUrl({scope:['openid','email','profile'],state:hash(browserToken),code_challenge:verifier.codeChallenge,code_challenge_method:CodeChallengeMethod.S256,prompt:'select_account'}));url.searchParams.set('nonce',nonce);
 return {browserToken,url:url.href};
}
export async function finishGoogle(env:Env,browserToken:string,state:string,code:string){
 if(!/^[\w-]{43}$/.test(browserToken)||!equal(hash(browserToken),state)||!code||code.length>4000)throw new AdminError('Login inválido ou expirado.',401);
 const row=await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND kind=? AND expires>? RETURNING value').bind(hash(browserToken),'google',Date.now()).first<{value:string}>();
 if(!row)throw new AdminError('Login expirado. Tente novamente.',401);
 const transaction=JSON.parse(row.value) as {nonce:string;verifier:string},oauth=client(env);
 const result=await oauth.getToken({code,codeVerifier:transaction.verifier});if(!result.tokens.id_token)throw new AdminError('Identidade não confirmada.',401);
 const ticket=await oauth.verifyIdToken({idToken:result.tokens.id_token,audience:env.GOOGLE_CLIENT_ID}),identity=ticket.getPayload();
 if(!identity?.sub||!identity.email||identity.email_verified!==true||!identity.nonce||!equal(identity.nonce,transaction.nonce)||!allowlist(env).includes(identity.email.toLowerCase()))throw new AdminError('Conta não autorizada.',403);
 let picture:string|undefined;
 if(identity.picture){try{const u=new URL(identity.picture);if(u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='googleusercontent.com'||u.hostname.endsWith('.googleusercontent.com')))picture=u.href;}catch{}}
 const secret=random(),session:Session={email:identity.email.toLowerCase(),sub:identity.sub,csrf:random(),expires:Date.now()+28800000,...(identity.name?.trim()?{name:identity.name.trim().slice(0,200)}:{}),...(picture?{picture}:{})};
 await env.DB.prepare('INSERT INTO auth_records(key,kind,value,expires) VALUES(?,?,?,?)').bind(hash(secret),'session',JSON.stringify(session),session.expires).run();
 return secret;
}
export async function revoke(env:Env,request:Request){const secret=cookies(request)[sessionCookie];if(secret)await env.DB.prepare('DELETE FROM auth_records WHERE key=? AND kind=?').bind(hash(secret),'session').run();}
export async function rateLimit(env:Env,request:Request,scope:string,max=15){
 const minute=Math.floor(Date.now()/60000),key=scope+':'+hash((request.headers.get('CF-Connecting-IP')??'unknown')+':'+minute);
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,Date.now()+120000).first<{count:number}>();
 if(!row||row.count>max)throw new AdminError('Muitas tentativas. Aguarde um minuto.',429);
}
