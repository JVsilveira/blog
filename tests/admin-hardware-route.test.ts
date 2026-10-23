import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {AdminError} from '../admin/lib/config';
const mocks=vi.hoisted(()=>({requireSession:vi.fn()}));
vi.mock('../admin/lib/request',async original=>({...await original<typeof import('../admin/lib/request')>(),requireSession:mocks.requireSession}));
import {GET,POST} from '../admin/app/api/hardware/route';
let root:string;
beforeEach(async()=>{root=await mkdtemp(path.join(tmpdir(),'portal-hardware-route-'));await mkdir(path.join(root,'src/data'),{recursive:true});await writeFile(path.join(root,'src/data/hardware.json'),'{"schemaVersion":1,"items":[]}');vi.stubEnv('EDITORIAL_ROOT',root);vi.stubEnv('EDITORIAL_ORIGIN','https://editor.example.org');vi.stubEnv('EDITORIAL_ADMIN_EMAILS','editor@example.org');vi.stubEnv('GOOGLE_CLIENT_ID','fixture');vi.stubEnv('GOOGLE_CLIENT_SECRET','fixture');vi.stubEnv('ICECAT_ENABLED','false');vi.stubEnv('ICECAT_API_TOKEN','fixture-private-token');mocks.requireSession.mockResolvedValue({email:'editor@example.org',sub:'fixture',csrf:'a'.repeat(43),expires:9999999999999});});
afterEach(async()=>{vi.restoreAllMocks();vi.unstubAllEnvs();await rm(root,{recursive:true,force:true});});
const req=(csrf='a'.repeat(43),origin='https://editor.example.org')=>new Request('https://editor.example.org/api/hardware',{method:'POST',headers:{Origin:origin,'X-CSRF-Token':csrf,'Content-Type':'application/json'},body:JSON.stringify({action:'sync'})});
it('protege leitura e mutação por sessão, CSRF e origem antes de consultar o provedor',async()=>{
 const provider=vi.fn();vi.stubGlobal('fetch',provider);
 mocks.requireSession.mockRejectedValueOnce(new AdminError('Entre novamente.',401));expect((await GET(new Request('https://editor.example.org/api/hardware'))).status).toBe(401);
 expect((await POST(req('wrong'))).status).toBe(403);expect((await POST(req('a'.repeat(43),'https://other.example.org'))).status).toBe(403);expect((await POST(req())).status).toBe(503);expect(provider).not.toHaveBeenCalled();vi.unstubAllGlobals();
});
it('retorna somente estado privado sem credencial e não dispara rede em GET',async()=>{
 const response=await GET(new Request('https://editor.example.org/api/hardware'));expect(response.status).toBe(200);const body=await response.text();expect(body).not.toContain('fixture-private-token');expect(JSON.parse(body)).toMatchObject({items:[],configured:false});expect(response.headers.get('Cache-Control')).toContain('no-store');
});
