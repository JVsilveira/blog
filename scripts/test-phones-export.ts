import { cp,mkdtemp,mkdir,writeFile,rm,readFile,access,symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { phoneFixture } from '../tests/fixtures/phones';

const root = await mkdtemp(path.join(tmpdir(),'portal-phones-'));
try {
  for (const name of ['src','public','scripts/finalize-export.ts','next.config.ts','tsconfig.json','next-env.d.ts','package.json']) await cp(name,path.join(root,name),{recursive:true});
  await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
  const fixture=phoneFixture(); const data=fixture.catalog;
  await writeFile(path.join(root,'src/data/phones.json'),JSON.stringify({schemaVersion:1,variants:[...fixture.variants,{...fixture.variants[0],id:'variant-third',slug:'variant-third',region:'Outra região sintética'},{...fixture.variants[0],id:'draft-phone',slug:'draft-phone',status:'draft'}]}));
  const {articles,...catalog}=data;
  await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog));
  await rm(path.join(root,'src/content/articles'),{recursive:true});
  await mkdir(path.join(root,'src/content/articles'),{recursive:true});
  for (const {body,...metadata} of articles) {
    const folder=path.join(root,'src/content/articles',metadata.slug); await mkdir(folder,{recursive:true});
    await writeFile(path.join(folder,'article.json'),JSON.stringify(metadata)); await writeFile(path.join(folder,'body.md'),body);
  }
  execFileSync(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,stdio:'pipe'});
  execFileSync(process.execPath,['--import','tsx','scripts/finalize-export.ts'],{cwd:root,stdio:'pipe'});
  const listing=await readFile(path.join(root,'out/celulares/index.html'),'utf8'); assert.match(listing,/Aparelho sintético/); assert.match(listing,/SINT-256/);
  const detail=await readFile(path.join(root,'out/celulares/variant-test/index.html'),'utf8');
  for(const text of ['Resumo sintético','Não confirmado','Ficha da variante','Fontes do resumo','NFC: Não','Consulta indisponível']) assert(detail.includes(text),text);
  const compare=await readFile(path.join(root,'out/celulares/comparar/index.html'),'utf8');assert.match(compare,/noindex/);assert.match(compare,/Aparelho(?:<!-- -->|\s)*2/);
  await assert.rejects(access(path.join(root,'out/celulares/draft-phone/index.html')));
  assert(!listing.includes('draft-phone'));assert(!compare.includes('draft-phone'));
  if(process.argv.includes('--preview')) { await rm('output/phones-preview',{recursive:true,force:true}); await cp(path.join(root,'out'),'output/phones-preview',{recursive:true}); }
  console.log('Export celulares isolado aprovado: fichas HTML, fontes, variantes; draft ausente e comparação noindex.');
} catch(error) {
  if (error && typeof error === 'object' && 'stdout' in error) console.error(String(error.stdout),String('stderr' in error ? error.stderr : ''));
  throw error;
} finally { await rm(root,{recursive:true,force:true}); }
