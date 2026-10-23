import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import path from 'node:path';import {tmpdir} from 'node:os';
import {hardwareFixture} from './fixtures/hardware';
import {hardwareJob,hardwareState,queueHardware,executeHardware,readHardware,mergeHardware} from '../admin/lib/hardware';
import {IndexScanner,fetchIcecatIndex} from '../src/lib/providers/icecat-index';
import {fetchIcecatReference,IcecatError} from '../src/lib/providers/icecat';
let root:string;
beforeEach(async()=>{root=await mkdtemp(path.join(tmpdir(),'portal-hardware-admin-'));await mkdir(path.join(root,'src/data'),{recursive:true});await writeFile(path.join(root,'src/data/hardware.json'),JSON.stringify({schemaVersion:1,items:[]}));vi.stubEnv('ICECAT_ENABLED','true');vi.stubEnv('ICECAT_API_TOKEN','private-fixture-api-token');});
afterEach(async()=>{vi.unstubAllEnvs();await rm(root,{recursive:true,force:true});});
const fresh=()=>({...hardwareFixture('ram')[0]!,id:'icecat-ram-123',status:'draft' as const,reviewedAt:null,reviewer:null,variant:'PREENCHER: variante'});
const request={kind:'ram',reference:{icecatId:'123'}};
const deps=()=>({fetchItem:vi.fn().mockResolvedValue(fresh()),fetchIndex:vi.fn().mockResolvedValue({entries:[{icecatId:'123',kind:'ram',name:'Synthetic',productCode:'SINT',supplierId:'1'}],catalogVersion:2,removedIds:[],updatedAt:new Date().toISOString()})});
it('importa todas as especificações e disponibiliza automaticamente sem aprovação',async()=>{
 const job=await queueHardware(root,'import',[request]);await executeHardware(root,job,deps());
 let state=await hardwareState(root);expect(state.items).toHaveLength(1);expect(state.items[0]!.status).toBe('published');
 const item=(await readHardware(root)).items[0]!;expect(item.specifications).toHaveLength(3);expect(item.variant).toContain('SINT-1');
 expect(item.status).toBe('published');expect(item.publication).toBe('provider');expect(item.reviewer).toBeNull();expect(item.reviewedAt).toBeNull();
 state=await hardwareState(root);expect(state.revision).not.toBe('');expect((await hardwareJob(root))?.results[0]?.status).toBe('imported');
});
it('sincroniza ficha idêntica e alterações sem exigir revisão humana',()=>{
 const prior=mergeHardware(fresh(),undefined).item;
 const incoming={...fresh(),updatedAt:'2026-10-24T12:00:00Z'};
 const same=mergeHardware(incoming,prior);expect(same.status).toBe('unchanged');expect(same.item.reviewedAt).toBe(prior.reviewedAt);expect(same.item.lastSyncedAt).toBe(incoming.updatedAt);
 incoming.specifications=structuredClone(incoming.specifications);incoming.specifications[0]!.value=99;
 const changed=mergeHardware(incoming,prior);expect(changed.status).toBe('updated');expect(changed.item.status).toBe('published');expect(changed.item.reviewedAt).toBeNull();expect(changed.item.publication).toBe('provider');
});
it('limita lote, recusa jobs duplicados e credencial em campos',async()=>{
 await expect(queueHardware(root,'import',Array.from({length:11},()=>request))).rejects.toThrow();
 const job=await queueHardware(root,'import',[request]);await expect(queueHardware(root,'index')).rejects.toThrow(/andamento/);
 await executeHardware(root,job,deps());
 await expect(queueHardware(root,'import',[{kind:'ram',reference:{brand:'private-fixture-api-token',productCode:'x'}}])).rejects.toThrow(/credenciais/);
});
it('mantém dados diante de falha e torna erro por item visível no resultado',async()=>{
 const job=await queueHardware(root,'import',[request]);const mock=deps();mock.fetchItem.mockRejectedValue(new IcecatError('Ficha fora da assinatura.'));await executeHardware(root,job,mock);
 expect((await readHardware(root)).items).toEqual([]);expect((await hardwareJob(root))!.results[0]).toMatchObject({status:'failed',message:'Ficha fora da assinatura.'});
});
it('atualiza cache e arquiva item explicitamente removido pelo índice, sem tratar ausência diária como remoção',async()=>{
 const item={...fresh(),status:'published',variant:'Kit revisado',reviewedAt:fresh().updatedAt,reviewer:'Revisor'};await writeFile(path.join(root,'src/data/hardware.json'),JSON.stringify({schemaVersion:1,items:[item]}));
 let job=await queueHardware(root,'index');await executeHardware(root,job,deps());expect((await readHardware(root)).items[0]!.status).toBe('published');
 const mock=deps();mock.fetchIndex.mockResolvedValue({entries:[],removedIds:['123'],updatedAt:new Date().toISOString()});job=await queueHardware(root,'index');await executeHardware(root,job,mock);expect((await readHardware(root)).items[0]!.status).toBe('archived');
});
it('parser de índice suporta chunks, aspas, entidades e filtra categorias sem executar XML externo',()=>{
 const scanner=new IndexScanner();const xml=`<?xml version="1.0"?><!DOCTYPE index SYSTEM "https://example.org/not-fetched"><files.index><file Product_ID="123" Catid="911" Model_Name="Kit &amp; teste > simples" Prod_ID="SINT"/><file path="/export/EN/456.xml" Product_ID="0" Catid="1893" Model_Name="Phone"/><file Product_ID="789" Catid="989" Model_Name="CPU"/><file Product_ID="111" Catid="911" Quality="REMOVED"/><file Product_ID="222" Catid="911" Limited="Yes"/><file Product_ID="333" Catid="1" Model_Name="Other"/></files.index>`;
 for(let i=0;i<xml.length;i+=11)scanner.push(xml.slice(i,i+11));expect(scanner.entries.map(i=>i.kind)).toEqual(['ram','phone','cpu']);expect(scanner.entries[0]!.name).toBe('Kit & teste > simples');expect(scanner.removedIds).toEqual(['111']);
});
it('consulta por marca/código preserva encoding e token somente no header',async()=>{
 const data={msg:'OK',data:{DemoAccount:false,GeneralInfo:{IcecatId:123,Title:'Synthetic',Brand:'Synthetic',BrandPartCode:'SINT',Category:{Name:{Value:'Memory'}}},FeaturesGroups:[{FeatureGroup:{Name:{Value:'Memory'}},Features:[{Value:'16',Feature:{ID:1,Name:{Value:'Internal memory'}}}]}]}};
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));await fetchIcecatReference({brand:'A & B',productCode:'A/B+1'},'ram',{ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'private-fixture-api-token'},fetcher);const [url,options]=fetcher.mock.calls[0]!;expect(url.searchParams.get('Brand')).toBe('A & B');expect(url.searchParams.get('ProductCode')).toBe('A/B+1');expect(url.searchParams.has('icecat_id')).toBe(false);expect(options.headers['api-token']).toBe('private-fixture-api-token');
});
it('recusa download de índice sem configuração antes de consultar rede',async()=>{const fetcher=vi.fn();await expect(fetchIcecatIndex({},fetcher)).rejects.toThrow(/Configure/);expect(fetcher).not.toHaveBeenCalled();});
it('alimentação automática percorre todas as categorias sem limitar a dois produtos e reaproveita índice completo recente',async()=>{
 const mock=deps();const entries=[11,12,13,21,22,23,31].map(id=>({icecatId:String(id),kind:id<20?'phone':id<30?'ram':'cpu',name:'Synthetic '+id,productCode:'SINT-'+id,supplierId:'1'}));
 await mkdir(path.join(root,'.editorial-admin'),{recursive:true});await writeFile(path.join(root,'.editorial-admin/icecat-index.json'),JSON.stringify({entries,catalogVersion:2,removedIds:[],updatedAt:new Date().toISOString(),fullUpdatedAt:new Date().toISOString(),scope:'full'}));
 mock.fetchItem.mockImplementation(async(reference,kind)=>({...hardwareFixture(kind)[0]!,id:`icecat-${kind}-${reference.icecatId}`,status:'draft',reviewedAt:null,reviewer:null}));
 const job=await queueHardware(root,'sync',[],false);await executeHardware(root,job,mock);expect(mock.fetchIndex).not.toHaveBeenCalled();expect(mock.fetchItem).toHaveBeenCalledTimes(7);const items=(await readHardware(root)).items;expect(items.filter(i=>i.kind==='phone')).toHaveLength(3);expect(items.filter(i=>i.kind==='ram')).toHaveLength(3);expect(items.filter(i=>i.kind==='cpu')).toHaveLength(1);expect(items.every(i=>i.status==='published'&&i.publication==='provider'&&!i.reviewer)).toBe(true);
});

it('retoma a carga além do primeiro lote e publica manifestos e fichas sem novo build',async()=>{
 const mock=deps();const entries=Array.from({length:105},(_,i)=>({icecatId:String(i+1),kind:'ram',name:'Synthetic '+i,productCode:'SINT-'+i,supplierId:'1'}));
 mock.fetchIndex.mockResolvedValue({entries,catalogVersion:2,removedIds:[],updatedAt:new Date().toISOString()});
 mock.fetchItem.mockImplementation(async(reference,kind)=>({...hardwareFixture(kind)[0]!,id:`icecat-${kind}-${reference.icecatId}`,status:'draft',reviewedAt:null,reviewer:null}));
 await executeHardware(root,await queueHardware(root,'sync',[],false),mock);expect((await readHardware(root)).items).toHaveLength(100);
 await executeHardware(root,await queueHardware(root,'sync',[],false),mock);expect((await readHardware(root)).items).toHaveLength(105);expect(mock.fetchIndex).toHaveBeenCalledTimes(1);
 expect(JSON.parse(await readFile(path.join(root,'src/data/hardware.json'),'utf8')).items).toHaveLength(6);
 const feed=JSON.parse(await readFile(path.join(root,'out/data/hardware/ram.json'),'utf8'));expect(feed.items).toHaveLength(105);const item=JSON.parse(await readFile(path.join(root,'out',feed.items[0].asset),'utf8'));expect(item.status).toBe('published');expect(item.reviewer).toBeNull();expect(JSON.stringify(feed)).not.toContain('private-fixture-api-token');
});
it('preserva cobertura completa ao mesclar delta e remove só IDs explicitamente removidos',async()=>{
 const mock=deps();await mkdir(path.join(root,'.editorial-admin'),{recursive:true});await writeFile(path.join(root,'.editorial-admin/icecat-index.json'),JSON.stringify({scope:'full',fullUpdatedAt:new Date().toISOString(),updatedAt:'2026-01-01T00:00:00Z',entries:[{icecatId:'456',kind:'ram',name:'Existing',productCode:'OLD',supplierId:'1'}],catalogVersion:2,removedIds:[]}));
 await executeHardware(root,await queueHardware(root,'sync'),mock);expect(mock.fetchItem).toHaveBeenCalledTimes(2);const cache=JSON.parse(await readFile(path.join(root,'.editorial-admin/icecat-index.json'),'utf8'));expect(cache.entries).toHaveLength(2);expect(mock.fetchIndex.mock.calls[0]?.[2]).toBe('daily');
});
it('interrompe lote por rate limit e não ultrapassa a proteção mensal gratuita',async()=>{
 const mock=deps();mock.fetchItem.mockRejectedValue(new IcecatError('Rate limit',true));await executeHardware(root,await queueHardware(root,'import',[request,{...request,reference:{icecatId:'456'}}]),mock);expect(mock.fetchItem).toHaveBeenCalledTimes(1);expect(JSON.parse(await readFile(path.join(root,'.editorial-admin/icecat-pause.json'),'utf8')).until).toBeGreaterThan(Date.now());
 await writeFile(path.join(root,'.editorial-admin/icecat-usage.json'),JSON.stringify({month:new Date().toISOString().slice(0,7),count:900000}));mock.fetchItem.mockClear();await executeHardware(root,await queueHardware(root,'import',[request]),mock);expect(mock.fetchItem).not.toHaveBeenCalled();expect((await hardwareJob(root))?.message).toContain('limite mensal');
});

it('prioriza fotos de celulares existentes antes de novos modelos do mesmo grupo',async()=>{
 const existing={...hardwareFixture('phone')[0]!,id:'icecat-phone-999',publication:'provider',source:{...hardwareFixture('phone')[0]!.source,license:'Open Icecat Open Content License'},reviewer:null,reviewedAt:null};await writeFile(path.join(root,'src/data/hardware.json'),JSON.stringify({schemaVersion:1,items:[existing]}));
 const mock=deps();mock.fetchIndex.mockResolvedValue({catalogVersion:2,entries:[{icecatId:'123',kind:'phone',name:'New',productCode:'NEW',supplierId:'1'},{icecatId:'999',kind:'phone',name:'Existing',productCode:'OLD',supplierId:'1'}],removedIds:[],updatedAt:new Date().toISOString()});
 mock.fetchItem.mockImplementation(async(reference,kind)=>({...hardwareFixture(kind)[0]!,id:`icecat-${kind}-${reference.icecatId}`,syncVersion:2,status:'draft',reviewedAt:null,reviewer:null}));await executeHardware(root,await queueHardware(root,'sync'),mock);expect(mock.fetchItem.mock.calls[0]?.[0]).toEqual({icecatId:'999'});
});

it('publica link de afiliado só depois de importar exatamente o aparelho identificado',async()=>{
 const link={retailer:'amazon' as const,href:'https://www.amazon.com.br/dp/B012345678?tag=fixture-20'},mock=deps();mock.fetchItem.mockResolvedValue({...hardwareFixture('phone')[0]!,id:'icecat-phone-123',status:'draft',reviewer:null,reviewedAt:null});const job=await queueHardware(root,'import',[{kind:'phone',reference:{gtin:'7891234567895'}}],true,link);await executeHardware(root,job,mock);const links=JSON.parse(await readFile(path.join(root,'out/data/hardware/links.json'),'utf8'));expect(links).toEqual([expect.objectContaining({hardwareId:'icecat-phone-123',href:link.href,retailer:'amazon'})]);
});

it.each(['phone','cpu','ram'] as const)('associa link Mercado Livre e ID resolvido somente à ficha importada de %s',async kind=>{
 const link={retailer:'mercadolivre' as const,href:'https://meli.la/fixture',productId:'MLB123456789',catalog:false},mock=deps();mock.fetchItem.mockResolvedValue({...hardwareFixture(kind)[0]!,id:`icecat-${kind}-123`,status:'draft',reviewer:null,reviewedAt:null});
 await executeHardware(root,await queueHardware(root,'import',[{kind,reference:{gtin:'7891234567895'}}],true,link),mock);
 expect(JSON.parse(await readFile(path.join(root,'out/data/hardware/links.json'),'utf8'))).toEqual([expect.objectContaining({...link,hardwareId:`icecat-${kind}-123`})]);
});
it('não publica associação quando o provedor não encontra a ficha',async()=>{
 const mock=deps();mock.fetchItem.mockRejectedValue(new IcecatError('Ficha indisponível.'));
 await executeHardware(root,await queueHardware(root,'import',[request],true,{retailer:'mercadolivre',href:'https://meli.la/fixture',productId:'MLB123456789',catalog:false}),mock);
 expect(JSON.parse(await readFile(path.join(root,'out/data/hardware/links.json'),'utf8'))).toEqual([]);
});
