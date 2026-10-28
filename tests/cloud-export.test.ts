import {it,expect,vi,afterEach} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fixture} from './fixtures/catalog';
import {importCloudEditorial} from '../scripts/import-cloud-editorial';
import {recommendationCardSchema} from '../src/domain/recommendation-feed';
const roots:string[]=[];
afterEach(async()=>{vi.unstubAllGlobals();await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
const env={EDITORIAL_EXPORT_URL:'https://editor.example.org/internal/export',EDITORIAL_EXPORT_TOKEN:'private-test-token'};
it('não chama rede sem integração configurada',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);await importCloudEditorial({});expect(fetcher).not.toHaveBeenCalled();});
it('falha antes de alterar arquivos quando exportação é recusada ou inválida',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'cloud-export-'));roots.push(root);await mkdir(path.join(root,'src/content/articles'),{recursive:true});const marker=path.join(root,'src/content/articles/existing');await writeFile(marker,'preservado');
 for(const response of [new Response(null,{status:401}),Response.json({data:{},operations:{schemaVersion:1,records:[]},revision:'revision'})]){vi.stubGlobal('fetch',vi.fn(async()=>response));await expect(importCloudEditorial(env,root)).rejects.toBeTruthy();expect(await readFile(marker,'utf8')).toBe('preservado');}
});
it('exporta conteúdo validado por canal autenticado e só publica identificador de versão',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'cloud-export-'));roots.push(root);await mkdir(path.join(root,'src/data'),{recursive:true});const data=fixture();data.articles=[];data.products=[];data.offers=[];data.reviews=[];
 const card=recommendationCardSchema.parse({id:'MLB123456',catalogId:'MLB123456',name:'Produto sintético de teste',category:'Teste',affiliateUrl:'https://www.mercadolivre.com.br/p/MLB123456',image:null,facts:[],state:'active',checkedAt:'2026-10-28T12:00:00Z',price:null});
 const fetcher=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>{void _input;void _init;return Response.json({data,operations:{schemaVersion:1,records:[]},revision:'revision-test',recommendations:{items:[card]}});} );vi.stubGlobal('fetch',fetcher);
 await importCloudEditorial(env,root);expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({Authorization:'Bearer private-test-token'});
 expect(JSON.parse(await readFile(path.join(root,'public/data/editorial-version.json'),'utf8'))).toEqual({revision:'revision-test'});
 expect(await readFile(path.join(root,'src/data/catalog.json'),'utf8')).not.toContain('private-test-token');
 expect(JSON.parse(await readFile(path.join(root,'src/data/recommendations.json'),'utf8'))).toEqual({items:[card]});
});
