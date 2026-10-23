import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, limitedJSON } from '../../../lib/request';
import { checkMutation } from '../../../lib/auth';
import { AdminError } from '../../../lib/config';
import { suggestTitle } from '../../../lib/title-ai';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => NextResponse.json(data, {status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    checkMutation(request, session);
    return json(await suggestTitle(await limitedJSON(request), request.signal));
  } catch (error) {
    if (error instanceof AdminError) return json({error:error.message},error.status);
    if (error instanceof z.ZodError) return json({error:error.issues[0]?.message ?? 'Confira o conteúdo da postagem.'},400);
    return json({error:'Não foi possível sugerir um título. Tente novamente.'},500);
  }
}
