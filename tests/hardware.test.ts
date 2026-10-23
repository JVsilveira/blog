import { expect,it,vi } from 'vitest';
import { hardwareFixture,hardwareDate } from './fixtures/hardware';
import { hardwareCatalogSchema } from '../src/domain/hardware/contracts';
import { analyzeValue,benchmarkKey,inputPriceCents,resolveHardwareIds,specificationRows,displaySpecification,specificationDisplay } from '../src/domain/hardware/compare';
import { fetchIcecat,normalizeIcecat } from '../src/lib/providers/icecat';
const apiFixture=()=>({msg:'OK',data:{DemoAccount:false,GeneralInfo:{IcecatId:123,Title:'Processor synthetic',Brand:'Synthetic',BrandPartCode:'SINT',Category:{Name:{Value:'Processors'}}},FeaturesGroups:[{FeatureGroup:{Name:{Value:'Processor'}},Features:[{RawValue:'8',Value:'8',Feature:{ID:'1',Name:{Value:'Cores'},Measure:{Signs:{_:'cores'}}}},{RawValue:false,Feature:{ID:'2',Name:{Value:'Absent feature'}}},{RawValue:null,Value:null,Feature:{ID:'3',Name:{Value:'Unknown feature'}}}]}]}});
it('preserva toda ficha, campo desconhecido e false, sem inventar benchmark ou publicar importação',()=>{
 const item=normalizeIcecat(apiFixture(),'cpu',hardwareDate);
 expect(item.status).toBe('draft');expect(item.reviewedAt).toBeNull();expect(item.specifications).toHaveLength(3);expect(item.specifications.map(s=>s.value)).toEqual(['8',false,null]);expect(item.benchmarks).toEqual([]);
 expect(item.source.url).toBe('https://live.icecat.biz/api?lang=EN&icecat_id=123');
 const ram=apiFixture();ram.data.GeneralInfo.Category.Name.Value='Memory';expect(normalizeIcecat(ram,'ram',hardwareDate).kind).toBe('ram');
 const phone=apiFixture();phone.data.GeneralInfo.Category.Name.Value='Smartphones';expect(normalizeIcecat(phone,'phone',hardwareDate).kind).toBe('phone');
});
it('recusa conta demo, categoria errada e variantes pendentes na publicação',()=>{
 const demo=apiFixture();demo.data.DemoAccount=true;expect(()=>normalizeIcecat(demo,'cpu',hardwareDate)).toThrow(/demonstração/);
 expect(()=>normalizeIcecat(apiFixture(),'ram',hardwareDate)).toThrow(/categoria/);
 const item=normalizeIcecat(apiFixture(),'cpu',hardwareDate);
 expect(hardwareCatalogSchema.safeParse({schemaVersion:1,items:[{...item,status:'published',reviewedAt:hardwareDate,reviewer:'Revisor'}]}).success).toBe(false);
});
it('fronteira recusa demonstrações publicadas, fontes inseguras, IDs e campos duplicados',()=>{
 const item=hardwareFixture()[0]!;
 for(const changed of [{...item,demonstration:true},{...item,source:{...item.source,url:'javascript:alert(1)'}},{...item,specifications:[item.specifications[0],item.specifications[0]]},{...item,reviewedAt:null}])expect(hardwareCatalogSchema.safeParse({schemaVersion:1,items:[changed]}).success).toBe(false);
 expect(hardwareCatalogSchema.safeParse({schemaVersion:1,items:[item,item]}).success).toBe(false);
});
it('resolve seleção sem substituir IDs indisponíveis e preserva desconhecidos no filtro de diferenças',()=>{
 const items=hardwareFixture();expect(resolveHardwareIds('missing,fixture-cpu-2,fixture-cpu-2,fixture-cpu-1',items)).toMatchObject({ids:['fixture-cpu-2','fixture-cpu-1']});
 expect(specificationRows(items,true).map(([,s])=>s.key)).toEqual(['sint-capacity','sint-unknown']);
 expect(displaySpecification(false)).toBe('Não');expect(displaySpecification(null)).toBe('Não confirmado');
});
it('desempenho por preço considera custos extras, empates e testes em que menor é melhor',()=>{
 const items=hardwareFixture().slice(0,2),key=benchmarkKey(items[0]!.benchmarks[0]!);
 expect(analyzeValue(items,key,{'fixture-cpu-1':10000,'fixture-cpu-2':10000})).toMatchObject({ready:true,winnerIds:['fixture-cpu-2'],performanceIds:['fixture-cpu-2']});
 expect(analyzeValue(items,key,{'fixture-cpu-1':10000,'fixture-cpu-2':10000},{'fixture-cpu-2':20000})).toMatchObject({ready:true,winnerIds:['fixture-cpu-1']});
 expect(analyzeValue(items,key,{'fixture-cpu-1':10000,'fixture-cpu-2':20000})).toMatchObject({ready:true,winnerIds:['fixture-cpu-1','fixture-cpu-2']});
 items.forEach(i=>{i.benchmarks[0]!.direction='lower';i.benchmarks[0]!.unit='ns';});
 expect(analyzeValue(items,benchmarkKey(items[0]!.benchmarks[0]!),{'fixture-cpu-1':10000,'fixture-cpu-2':10000})).toMatchObject({ready:true,winnerIds:['fixture-cpu-1'],performanceIds:['fixture-cpu-1']});
});
it('não conclui custo-benefício sem preço válido, benchmark equivalente ou mesma categoria',()=>{
 const items=hardwareFixture().slice(0,2),key=benchmarkKey(items[0]!.benchmarks[0]!);
 expect(analyzeValue(items,key,{}).ready).toBe(false);
 expect(analyzeValue(items,'',{}).ready).toBe(false);
 for(const field of ['suite','version','workload','unit','protocol','platform','settings'] as const){const changed=structuredClone(items);changed[1]!.benchmarks[0]![field]='diferente';expect(analyzeValue(changed,key,{'fixture-cpu-1':100,'fixture-cpu-2':100}).ready).toBe(false);}
 expect(analyzeValue([items[0]!,hardwareFixture('ram')[0]!],key,{}).ready).toBe(false);
 expect(analyzeValue(items,key,{'fixture-cpu-1':100,'fixture-cpu-2':100},{'fixture-cpu-2':-1}).ready).toBe(false);
 expect(inputPriceCents('1299,90')).toBe(129990);for(const raw of ['0','-5','NaN','12,999','1.299,90'])expect(inputPriceCents(raw)).toBeNull();
});
it('sem ativação, configuração válida ou ID numérico não chama a API',async()=>{
 const fetcher=vi.fn();await expect(fetchIcecat('123','cpu',{},fetcher)).rejects.toThrow(/desativada/);
 await expect(fetchIcecat('123','cpu',{ICECAT_ENABLED:'true',ICECAT_USERNAME:'registered'},fetcher)).rejects.toThrow(/API_TOKEN/);
 await expect(fetchIcecat('../x','cpu',{ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'private-fixture-api-token'},fetcher)).rejects.toThrow(/numérico/);expect(fetcher).not.toHaveBeenCalled();
});
it('consulta endpoint oficial com token somente em header, sem fallback ou exposição na ficha',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(apiFixture()),{status:200}));
 const env={ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'private-fixture-api-token',ICECAT_USERNAME:'ignored-user'};const item=await fetchIcecat('123','cpu',env,fetcher);expect(item.status).toBe('draft');expect(fetcher).toHaveBeenCalledTimes(1);
 const [url,request]=fetcher.mock.calls[0]!;expect(url.origin+url.pathname).toBe('https://live.icecat.biz/api');expect(url.searchParams.get('content')).toBe('generalinfo,featuregroups');expect(request.redirect).toBe('error');expect(request.headers['api-token']).toBe(env.ICECAT_API_TOKEN);expect(url.href).not.toContain(env.ICECAT_API_TOKEN);expect(url.searchParams.has('shopname')).toBe(false);expect(JSON.stringify(item)).not.toContain(env.ICECAT_API_TOKEN);expect(item.source.license).toMatch(/PREENCHER/);
 const refused=vi.fn().mockResolvedValue(new Response('{}',{status:403}));await expect(fetchIcecat('123','cpu',env,refused)).rejects.toThrow(/assinatura/);expect(refused).toHaveBeenCalledTimes(1);
 const mismatch=apiFixture();mismatch.data.GeneralInfo.IcecatId=456;await expect(fetchIcecat('123','cpu',env,vi.fn().mockResolvedValue(new Response(JSON.stringify(mismatch))))).rejects.toThrow(/identificador/);
});


it('segue ordenação documentada e preserva valor bruto, apresentação, unidade, zero e desconhecido',()=>{
 const api=apiFixture();
 const shaped={...api,data:{...api.data,FeaturesGroups:[
  {SortNo:'1',FeatureGroup:{Name:{Value:'Secondary'}},Features:[{SortNo:'1',RawValue:'',Value:'',PresentationValue:'',Feature:{ID:'50',Name:{Value:'Unknown'}}}]},
  {SortNo:'100',FeatureGroup:{Name:{Value:'Primary'}},Features:[
   {SortNo:'1',RawValue:0,PresentationValue:'0 MB',Feature:{ID:'10',Name:{Value:'Cache'},Measure:{Signs:{_:'MB'}}}},
   {SortNo:'20',RawValue:'6400',PresentationValue:'6,400 MT/s',Feature:{ID:'20',Name:{Value:'Transfer rate'},Measure:{Signs:{_:'MT/s'}}}},
  ]},
 ]}};
 const item=normalizeIcecat(shaped,'cpu',hardwareDate,'unconfirmed');
 expect(item.specifications.map(s=>s.key)).toEqual(['icecat-20','icecat-10','icecat-50']);
 expect(item.specifications[0]).toMatchObject({value:'6400',displayValue:'6,400 MT/s',unit:'MT/s'});
 expect(specificationDisplay(item.specifications[0])).toBe('6,400 MT/s');
 expect(item.specifications[1]!.value).toBe(0);expect(item.specifications[2]!.value).toBeNull();
 expect(specificationDisplay(item.specifications[2])).toBe('Não confirmado');
 expect(()=>normalizeIcecat({...api,data:{...api.data,GeneralInfo:{...api.data.GeneralInfo,Category:{Name:{Value:'Smartphone accessories'}}}}},'phone',hardwareDate)).toThrow(/categoria/);
 const ready={...item,variant:'Variante real revisada',reviewer:'Revisor',reviewedAt:hardwareDate,status:'published'};
 expect(hardwareCatalogSchema.safeParse({schemaVersion:1,items:[ready]}).success).toBe(false);
});
it('não retorna credencial ecoada pela API e mantém mensagens seguras em erros de autenticação',async()=>{
 const env={ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'private-fixture-api-token'};
 const echoed=apiFixture();echoed.data.GeneralInfo.Title=env.ICECAT_API_TOKEN;
 await expect(fetchIcecat('123','cpu',env,vi.fn().mockResolvedValue(new Response(JSON.stringify(echoed))))).rejects.toThrow(/privada/);
 for(const status of [401,403,404,429]){
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({Message:env.ICECAT_API_TOKEN}),{status}));
  let message='';try{await fetchIcecat('123','cpu',env,fetcher);}catch(error){message=(error as Error).message;}
  expect(message).not.toContain(env.ICECAT_API_TOKEN);expect(fetcher).toHaveBeenCalledTimes(1);
 }
 const fetcher=vi.fn();await expect(fetchIcecat('123','cpu',{ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'a\nb'},fetcher)).rejects.toThrow(/válido/);expect(fetcher).not.toHaveBeenCalled();
});

it('interpreta StatusCode numérico oficial sem depender do texto retornado pelo provedor',async()=>{
 const env={ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'private-fixture-api-token'};
 for(const [StatusCode,status,message] of [[18,404,/token inválido/],[19,400,/token inválido/],[9,403,/assinatura/],[14,404,/restrita/],[17,404,/não encontrada/]] as const){
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({StatusCode,Message:'arbitrary '+env.ICECAT_API_TOKEN}),{status}));
  await expect(fetchIcecat('123','cpu',env,fetcher)).rejects.toThrow(message);expect(fetcher).toHaveBeenCalledTimes(1);
 }
});
