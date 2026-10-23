// Loaded only by the isolated QA process, never by the real server.
import {gzipSync} from 'node:zlib';
if(!process.env.EDITORIAL_ROOT?.startsWith('/tmp/portal-editorial-preview-')||process.env.ICECAT_API_TOKEN!=='private-fixture-api-token')throw new Error('Somente QA isolado.');
const original=globalThis.fetch;
const devices=process.env.EDITORIAL_QA_DEVICES==='true';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
globalThis.fetch=async(input,init)=>{
 const request=new Request(input,init),url=new URL(request.url);
 if(url.hostname==='live.icecat.biz'){
  if(request.headers.get('api-token')!=='private-fixture-api-token')throw new Error('Credencial de QA incorreta.');
  const id=url.searchParams.get('icecat_id')??'123';
  if(devices){const tablet=id==='124',category=id==='125'?'Processors':tablet?'Tablets':'Smartphones';return new Response(JSON.stringify({msg:'OK',data:{DemoAccount:false,GeneralInfo:{IcecatId:Number(id),Title:tablet?'Tablet sintético '+id:'Samsung Galaxy S25 sintético '+id,Brand:tablet?'Marca de QA':'Samsung',BrandPartCode:'QA-'+id,Category:{CategoryID:id==='125'?'989':tablet?'897':'1893',Name:{Value:category}}},Image:{},Gallery:tablet?[]:[{Pic500x500:'https://images.icecat.biz/img/test.png?content_token=fixture-private-content',IsMain:'Y',Type:'ProductImage',IsPrivate:'0'}],FeaturesGroups:[{FeatureGroup:{Name:{Value:'Memória'}},Features:[{Value:'32',PresentationValue:'32 GB',Feature:{ID:1,Name:{Value:'Internal memory'}}}]}]}}),{headers:{'Content-Type':'application/json'}});}
  return new Response(JSON.stringify({msg:'OK',data:{DemoAccount:false,GeneralInfo:{IcecatId:Number(id),Title:'Kit de RAM sintético '+id,Brand:'Marca de QA',BrandPartCode:'QA-'+id,Category:{Name:{Value:'Memory'}}},FeaturesGroups:[{FeatureGroup:{Name:{Value:'Memória'}},Features:[{Value:'32',PresentationValue:'32 GB',Feature:{ID:1,Name:{Value:'Internal memory'},Measure:{Signs:{_:'GB'}}}},{Value:'2 x 16',PresentationValue:'2 x 16 GB',Feature:{ID:2,Name:{Value:'Memory layout (modules x size)'},Measure:{Signs:{_:'GB'}}}}]}]}}),{headers:{'Content-Type':'application/json'}});
 }
 if(devices&&url.hostname==='images.icecat.biz')return new Response(png,{headers:{'Content-Type':'image/png'}});
 if(devices&&url.hostname==='data.icecat.biz')return new Response(gzipSync('<files.index><file Product_ID="123" Catid="1893" Model_Name="Celular sintético 123"/><file Product_ID="124" Catid="897" Model_Name="Tablet sintético 124"/><file Product_ID="125" Catid="989" Model_Name="CPU sintética"/><file Product_ID="126" Catid="151" Model_Name="Notebook excluído"/></files.index>'));
 if(url.hostname==='data.icecat.biz')return new Response(gzipSync('<files.index><file Product_ID="123" Catid="911" Model_Name="Kit de RAM sintético 123" Prod_ID="QA-123"/><file Product_ID="124" Catid="911" Model_Name="Kit de RAM sintético 124" Prod_ID="QA-124"/></files.index>'));
 if(!['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname))throw new Error('Rede externa bloqueada no QA.');
 return original(input,init);
};
