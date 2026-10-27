export interface Statement {
 bind(...values:unknown[]):Statement;
 first<T=Record<string,unknown>>():Promise<T|null>;
 all<T=Record<string,unknown>>():Promise<{results:T[]}>;
 run():Promise<{meta:{changes:number}}>;
}
export interface Database {
 prepare(sql:string):Statement;
 batch(statements:Statement[]):Promise<{meta:{changes:number};results?:unknown[]}[]>;
}
export interface Env {
 DB:Database;ASSETS:{fetch(request:Request):Promise<Response>};
 EDITORIAL_ORIGIN:string;PUBLIC_SITE_URL:string;
 EDITORIAL_ADMIN_EMAILS:string;GOOGLE_CLIENT_ID:string;GOOGLE_CLIENT_SECRET:string;
 EDITORIAL_EXPORT_TOKEN:string;PAGES_DEPLOY_HOOK:string;
 QUOTE_AI_ENABLED?:string;QUOTE_ALLOWED_ORIGINS?:string;
 EDITORIAL_AI_ENABLED?:string;GEMINI_API_KEY?:string;
}
export type Context={waitUntil(work:Promise<unknown>):void};
