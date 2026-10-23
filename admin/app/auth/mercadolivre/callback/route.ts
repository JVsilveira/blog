import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {requireSession} from '../../../../lib/request';
import {cookieOptions} from '../../../../lib/auth';
import {config} from '../../../../lib/config';
import {finishMercadoConnection,mercadoCookie} from '../../../../lib/mercadolivre';
export const runtime='nodejs';
export async function GET(request:Request){const cfg=config();const response=NextResponse.redirect(cfg.origin+'/?mercadolivre=error',303);response.cookies.set(mercadoCookie,'',cookieOptions(0));try{const session=await requireSession(),params=new URL(request.url).searchParams,secret=(await cookies()).get(mercadoCookie)?.value;if(!secret||params.has('error'))return response;await finishMercadoConnection(cfg.root,cfg.origin,session,secret,params.get('state')??'',params.get('code')??'');const success=NextResponse.redirect(cfg.origin+'/?mercadolivre=connected',303);success.cookies.set(mercadoCookie,'',cookieOptions(0));return success;}catch{return response;}}
