import {refreshPhoneRanking} from '../../../lib/phone-ranking';
import {after,NextResponse} from 'next/server';
import {z} from 'zod';
import {requireSession,limitedJSON} from '../../../lib/request';
import {checkMutation} from '../../../lib/auth';
import {config,AdminError} from '../../../lib/config';
import {hardwareState,readHardwareItem,queueHardware,executeHardware} from '../../../lib/hardware';
import {IcecatError} from '../../../../src/lib/providers/icecat';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=900;
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
function fail(error:unknown){return json({error:error instanceof AdminError||error instanceof IcecatError?error.message:error instanceof z.ZodError?'Confira os campos informados e as fontes/licenças antes de salvar.':'Não foi possível acessar o catálogo. Tente novamente.'},error instanceof AdminError?error.status:error instanceof z.ZodError?400:500);}
export async function GET(request:Request){try{await requireSession();const root=config().root,url=new URL(request.url),id=url.searchParams.get('id');if(id){const item=await readHardwareItem(root,id);if(!item)throw new AdminError('Produto não encontrado.',404);return json({item});}const state=await hardwareState(root,(url.searchParams.get('q')??'').slice(0,200),url.searchParams.get('kind')??'',Math.max(1,Math.min(1000,Number(url.searchParams.get('page'))||1)));if(url.searchParams.get('summary')==='1'){const {coverage,job,configured,automatic,indexUpdatedAt}=state;return json({coverage,job,configured,automatic,indexUpdatedAt});}return json(state);}catch(error){return fail(error);}}
export async function POST(request:Request){try{const session=await requireSession();checkMutation(request,session);const root=config().root,input=z.object({action:z.enum(['index','import','sync'])}).passthrough().parse(await limitedJSON(request));const job=await queueHardware(root,input.action,input.requests??[]);after(async()=>{await executeHardware(root,job);await refreshPhoneRanking(root,process.env,fetch,Date.now(),true).catch(()=>{});});return json({job},202);}catch(error){return fail(error);}}
