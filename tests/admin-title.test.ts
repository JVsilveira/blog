import { afterEach, expect, it, vi } from 'vitest';
import { suggestTitle, titleAIStatus } from '../admin/lib/title-ai';
import { POST } from '../admin/app/api/title/route';
import { AdminError } from '../admin/lib/config';
const mocks = vi.hoisted(() => ({requireSession:vi.fn()}));
vi.mock('../admin/lib/request',async importOriginal => ({
  ...await importOriginal<typeof import('../admin/lib/request')>(), requireSession:mocks.requireSession,
}));
const draft = {
  title:'Como conferir seu backup',description:'Conferência de arquivos',category:'Suporte',
  methodology:'Análise documental',limitations:'Sem garantia de recuperação',
  body:'Antes de remover os arquivos originais, abra a cópia de segurança e confira os documentos importantes. Mantenha o original se houver falhas.',
  previous:[],
};
const answer = (title='Seu backup está completo? Veja o que conferir antes de apagar arquivos') => new Response(JSON.stringify({
  status:'completed',steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify({title})}]}],
}),{status:200});
function enabled() {
  vi.stubEnv('EDITORIAL_AI_ENABLED','true');
  vi.stubEnv('GEMINI_API_KEY','fixture-secret-not-real');
}
afterEach(() => {vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('desativada ou sem chave: nunca chama a API, mesmo se houver outra credencial no ambiente',async () => {
  const provider=vi.fn(); vi.stubGlobal('fetch',provider);
  vi.stubEnv('GEMINI_API_KEY','fixture-secret-not-real');
  for(const flag of ['', 'false', 'yes']) {
    vi.stubEnv('EDITORIAL_AI_ENABLED',flag);
    expect(titleAIStatus().enabled).toBe(false);
    await expect(suggestTitle(draft)).rejects.toThrow(/desativada/);
  }
  enabled();vi.stubEnv('GEMINI_API_KEY','');
  vi.stubEnv('OPENAI_API_KEY','fixture-unrelated-key');
  await expect(suggestTitle(draft)).rejects.toThrow(/chave/);
  expect(provider).not.toHaveBeenCalled();
});
it('uma chamada por clique: saída estruturada, contexto editorial, limite de tokens e chave somente no servidor',async () => {
  enabled();const provider=vi.fn().mockResolvedValue(answer());vi.stubGlobal('fetch',provider);
  const result=await suggestTitle({...draft,previous:['Outro título já sugerido']});
  expect(result.title).toMatch(/backup/);
  expect(provider).toHaveBeenCalledTimes(1);
  const [url,init]=provider.mock.calls[0]!;
  expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
  expect(init.headers['x-goog-api-key']).toBe('fixture-secret-not-real');
  expect(url).not.toContain('fixture-secret');
  const body=JSON.parse(init.body);
  expect(body).toMatchObject({model:'gemini-3.5-flash-lite',store:false,generation_config:{max_output_tokens:256,thinking_level:'minimal'},response_format:{type:'text',mime_type:'application/json'}});
  expect(body.tools).toBeUndefined();
  expect(body.agent).toBeUndefined();
  expect(body.input).toContain('Outro título já sugerido');
  expect(JSON.stringify(result)).not.toContain('fixture-secret');
});
it('rejeita título repetido e não dispara nova tentativa paga automaticamente',async () => {
  enabled();const provider=vi.fn().mockResolvedValue(answer(draft.title));vi.stubGlobal('fetch',provider);
  await expect(suggestTitle(draft)).rejects.toThrow(/repetiu/);
  expect(provider).toHaveBeenCalledTimes(1);
});
it('rejeita conteúdo curto e cancelamento antes do request, sem inferência',async () => {
  enabled();const provider=vi.fn();vi.stubGlobal('fetch',provider);
  await expect(suggestTitle({...draft,body:'curto'})).rejects.toThrow(/80 caracteres/);
  await expect(suggestTitle(draft,AbortSignal.abort())).rejects.toThrow(/cancelada/);
  expect(provider).not.toHaveBeenCalled();
});
it('recusa, JSON inválido e respostas incompletas não viram títulos',async () => {
  enabled();const provider=vi.fn();vi.stubGlobal('fetch',provider);
  for(const payload of [
    {status:'incomplete',steps:[]},
    {status:'completed',steps:[{type:'model_output',content:[{type:'refusal',refusal:'Não foi possível'}]}]},
    {status:'completed',steps:[{type:'model_output',content:[{type:'text',text:'not JSON'}]}]},
  ]) {
    provider.mockResolvedValueOnce(new Response(JSON.stringify(payload)));
    await expect(suggestTitle(draft)).rejects.toThrow(/título válido/);
  }
  expect(provider).toHaveBeenCalledTimes(3);
});
it('falhas de acesso e cota são seguras e não repetem a chamada',async () => {
  enabled();const provider=vi.fn();vi.stubGlobal('fetch',provider);
  for(const status of [400,401,403,404,429,500]) {
    provider.mockResolvedValueOnce(new Response('upstream fixture-secret-not-real',{status}));
    try {await suggestTitle(draft);throw new Error('expected rejection');}
    catch(error) {expect(error).toBeInstanceOf(AdminError);expect((error as Error).message).not.toMatch(/fixture-secret|upstream/);}
  }
  expect(provider).toHaveBeenCalledTimes(6);
});
it('uma geração em andamento bloqueia concorrência e libera o slot ao terminar',async () => {
  enabled();let release!:(value:Response)=>void;
  const provider=vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => {release=resolve;}));
  vi.stubGlobal('fetch',provider);
  const first=suggestTitle(draft);
  await expect(suggestTitle(draft)).rejects.toMatchObject({status:429});
  release(answer());await first;
  provider.mockResolvedValueOnce(answer());await suggestTitle(draft);
  expect(provider).toHaveBeenCalledTimes(2);
});
it('rota exige sessão e CSRF antes de qualquer chamada externa',async () => {
  enabled();vi.stubEnv('EDITORIAL_ORIGIN','https://editor.example.org');
  vi.stubEnv('EDITORIAL_ADMIN_EMAILS','editor@example.org');
  vi.stubEnv('EDITORIAL_ROOT','/tmp/portal-title-unit-test');
  vi.stubEnv('GOOGLE_CLIENT_ID','fixture-client');
  vi.stubEnv('GOOGLE_CLIENT_SECRET','fixture-google-secret');
  const provider=vi.fn();vi.stubGlobal('fetch',provider);
  mocks.requireSession.mockRejectedValueOnce(new AdminError('Entre novamente.',401));
  const request=() => new Request('https://editor.example.org/api/title',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://editor.example.org'},body:JSON.stringify(draft)});
  expect((await POST(request())).status).toBe(401);
  mocks.requireSession.mockResolvedValue({email:'editor@example.org',sub:'fixture',csrf:'a'.repeat(43),expires:9999999999999});
  expect((await POST(request())).status).toBe(403);
  vi.stubEnv('EDITORIAL_AI_ENABLED','false');
  const valid=request();valid.headers.set('X-CSRF-Token','a'.repeat(43));
  const disabled=await POST(valid);
  expect(disabled.status).toBe(503);
  expect(await disabled.json()).toMatchObject({error:expect.stringMatching(/desativada/)});
  expect(disabled.headers.get('Cache-Control')).toContain('no-store');
  expect(provider).not.toHaveBeenCalled();
});
