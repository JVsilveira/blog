import {NextResponse} from 'next/server';
import {requireSession} from '../../../../lib/request';
import {config} from '../../../../lib/config';
import {mercadoConnectionStatus} from '../../../../lib/mercadolivre';
export const dynamic='force-dynamic';
export async function GET(){try{await requireSession();const cfg=config();return NextResponse.json(await mercadoConnectionStatus(cfg.root,cfg.origin),{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'Entre novamente para continuar.'},{status:401,headers:{'Cache-Control':'private, no-store'}});}}
