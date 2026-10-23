import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';
import {icecatImageCandidate,importIcecatImage} from '../src/lib/providers/icecat-media';
import {normalizeIcecat,fetchIcecatReference} from '../src/lib/providers/icecat';
import {IndexScanner} from '../src/lib/providers/icecat-index';
import {matchesDevice,isMobileDevice} from '../src/domain/hardware/devices';
let root:string;
beforeEach(async()=>{root=await mkdtemp(path.join(tmpdir(),'portal-media-'));});
afterEach(async()=>{await rm(root,{recursive:true,force:true});});
const url='https://images.icecat.biz/img/gallery/device.jpg?content_token=fixture-private-content-token';
const photo=()=>({data:{Image:{Pic500x500:url},Gallery:[{Pic500x500:url,Pic500x500Width:'400',Pic500x500Height:'500',IsMain:'Y',Type:'ProductImage',IsPrivate:'0'}]}});
const fixture=(category='Tablets',CategoryID='897')=>({msg:'OK',data:{...photo().data,GeneralInfo:{IcecatId:123,Title:'Aparelho sintético',Brand:'Synthetic',BrandPartCode:'SINT',Category:{CategoryID,Name:{Value:category}}},FeaturesGroups:[{FeatureGroup:{Name:{Value:'Test'}},Features:[{Value:'32',Feature:{ID:1,Name:{Value:'Memory'}}}]}]}});
it('indexa somente celulares/tablets no grupo móvel e recusa acessórios e outras categorias',()=>{
 const parser=new IndexScanner();parser.push('<files.index>'+[119,897,1893,989,911,1234].map((id,i)=>`<file Product_ID="${i+1}" Catid="${id}" Model_Name="Synthetic"/>`).join('')+'</files.index>');expect(parser.entries.filter(i=>i.kind==='phone').map(i=>i.icecatId)).toEqual(['1','2','3']);
 expect(normalizeIcecat(fixture(),'phone').deviceType).toBe('tablet');expect(normalizeIcecat(fixture('Mobile Phones','119'),'phone').deviceType).toBe('phone');
 for(const [name,id] of [['Tablet Cases','897'],['Laptops','151'],['Processors','989'],['Smartphones','989']])expect(()=>normalizeIcecat(fixture(name,id),'phone')).toThrow(/categoria/);
 expect(matchesDevice({kind:'phone',deviceType:'tablet'},'tablet')).toBe(true);expect(matchesDevice({kind:'phone',deviceType:'tablet'},'phone')).toBe(false);expect(matchesDevice({kind:'phone'},'phone')).toBe(true);expect(isMobileDevice({kind:'cpu'})).toBe(false);expect(matchesDevice({kind:'ram'},'all')).toBe(false);
});
it('escolhe imagem principal e não publica logomarca, arquivo privado nem URL fora do Icecat',()=>{
 expect(icecatImageCandidate(photo())?.url.hostname).toBe('images.icecat.biz');
 for(const change of [{Type:'BrandLogo'},{IsPrivate:'1'},{TaxonomyName:'exclusive'},{Pic500x500:'https://evil.example/photo.jpg'},{Pic500x500:'http://127.0.0.1/image.png'}]){const input=photo();Object.assign(input.data.Gallery[0]!,change);expect(icecatImageCandidate(input)).toBeNull();}
 expect(icecatImageCandidate({data:{Image:{},Gallery:[]}})).toBeNull();
});
it('baixa imagem e grava URL local sem token nos registros públicos e no export',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
 const fetcher=vi.fn().mockResolvedValue(new Response(png,{headers:{'content-type':'image/png'}}));const saved=await importIcecatImage(photo(),root,'Aparelho sintético',fetcher);expect(saved).toMatchObject({width:400,height:500});expect(saved?.src).toMatch(/^\/images\/hardware\/[a-f0-9]{64}\.png$/);expect(JSON.stringify(saved)).not.toContain('token');expect(await readFile(path.join(root,'public',saved!.src))).toEqual(png);expect(await readFile(path.join(root,'out',saved!.src))).toEqual(png);expect(fetcher.mock.calls[0]?.[1].redirect).toBe('error');
});
it('falhas de imagem preservam disponibilidade da ficha e não aceitam HTML ou download grande',async()=>{
 for(const response of [new Response('denied',{status:403}),new Response('<html>',{headers:{'content-type':'image/png'}}),new Response('x',{headers:{'content-type':'image/jpeg','content-length':'3000001'}})])expect(await importIcecatImage(photo(),root,'Synthetic',vi.fn().mockResolvedValue(response))).toBeNull();
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(fixture()))).mockResolvedValueOnce(new Response('',{status:403}));const env={ICECAT_ENABLED:'true',ICECAT_API_TOKEN:'fixture-api',ICECAT_CONTENT_TOKEN:'fixture-content'};const item=await fetchIcecatReference({icecatId:'123'},'phone',env,fetcher,root);expect(item.deviceType).toBe('tablet');expect(item.specifications).toHaveLength(1);expect(item.image).toBeNull();expect(fetcher.mock.calls[0]?.[1].headers['content-token']).toBe('fixture-content');expect(JSON.stringify(item)).not.toContain('fixture-content');expect(fetcher.mock.calls[0]?.[0].searchParams.get('content')).toContain('gallery');
});
