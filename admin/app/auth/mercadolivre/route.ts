import {NextResponse} from 'next/server';
import {requireSession} from '../../../lib/request';
import {checkMutation,cookieOptions} from '../../../lib/auth';
import {config,AdminError} from '../../../lib/config';
import {beginMercadoConnection,mercadoCookie} from '../../../lib/mercadolivre';
export const runtime='nodejs';
export async function POST(request:Request){try{const session=await requireSession();checkMutation(request,session);const cfg=config(),result=await beginMercadoConnection(cfg.root,cfg.origin,session);const response=NextResponse.json({url:result.url},{headers:{'Cache-Control':'private, no-store'}});response.cookies.set(mercadoCookie,result.browserToken,cookieOptions(600));return response;}catch(error){return NextResponse.json({error:error instanceof AdminError?error.message:'Não foi possível iniciar a conexão.'},{status:error instanceof AdminError?error.status:503,headers:{'Cache-Control':'private, no-store'}});}}
