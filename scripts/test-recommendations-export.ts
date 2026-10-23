import { cp,mkdtemp,mkdir,writeFile,rm,readFile,access,symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { recommendationFixture } from '../tests/fixtures/recommendations';
const root = await mkdtemp(path.join(tmpdir(),'portal-recommendations-'));
try {
  for (const name of ['src','public','scripts/finalize-export.ts','next.config.ts','tsconfig.json','next-env.d.ts','package.json']) await cp(name,path.join(root,name),{recursive:true});
  await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
  const data = recommendationFixture(); const product=data.products[0]!; const review=data.reviews[0]!;
  data.products.push({...product,id:'archived-test',slug:'archived-test',name:'Produto sintético arquivado',status:'archived'});
  data.reviews.push({...review,id:'archived-review',productId:'archived-test'});
  data.products.push({...product,id:'second-test',slug:'second-test',name:'Segundo produto sintético'});
  data.reviews.push({...review,id:'second-review',productId:'second-test',method:'editorial',uses:['Reuniões']});
  data.products.push({...product,id:'draft-test',slug:'draft-test',name:'Rascunho sintético',status:'draft'});
  const {articles,...catalog}=data;
  await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog));
  await rm(path.join(root,'src/content/articles'),{recursive:true});
  for (const {body,...metadata} of articles) {
    const folder=path.join(root,'src/content/articles',metadata.slug); await mkdir(folder,{recursive:true});
    await writeFile(path.join(folder,'article.json'),JSON.stringify(metadata)); await writeFile(path.join(folder,'body.md'),body);
  }
  execFileSync(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,stdio:'pipe'});
  execFileSync(process.execPath,['--import','tsx','scripts/finalize-export.ts'],{cwd:root,stdio:'pipe'});
  const read=(slug:string) => readFile(path.join(root,'out/recomendacoes',slug,'index.html'),'utf8');
  const listing=await read(''); assert.match(listing,/CPU sintética/); assert.doesNotMatch(listing,/Produto sintético arquivado|Rascunho sintético/);
  const detail=await read('product-test');
  for (const text of ['Resumo sintético exclusivo','Análise documental','Limitação sintética','Não informado','Consultar preço na loja']) assert(detail.includes(text));
  assert(!detail.includes('?tag=fixture')); assert.match(await read('archived-test'),/Produto arquivado/); assert.doesNotMatch(await read('archived-test'),/https:\/\/example.org\/item/);
  await assert.rejects(access(path.join(root,'out/recomendacoes/draft-test/index.html')));
  await assert.rejects(access(path.join(root,'out/recomendacoes/sem-publicacao/index.html')));
  if (process.argv.includes('--preview')) { await rm('output/recommendations-preview',{recursive:true,force:true}); await cp(path.join(root,'out'),'output/recommendations-preview',{recursive:true}); }
  console.log('Export isolado aprovado: catálogo, detalhes em HTML, arquivado preservado sem compra, draft ausente e afiliados desligados.');
} catch(error) {
  if (error && typeof error === 'object' && 'stdout' in error) console.error(String(error.stdout),String('stderr' in error ? error.stderr : ''));
  throw error;
} finally { await rm(root,{recursive:true,force:true}); }
