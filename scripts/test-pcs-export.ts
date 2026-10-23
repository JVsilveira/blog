import { cp,mkdtemp,mkdir,writeFile,rm,readFile,access,symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { pcFixture } from '../tests/fixtures/pcs';
import { fixture as catalogFixture } from '../tests/fixtures/catalog';
const root = await mkdtemp(path.join(tmpdir(),'portal-pcs-'));
try {
  for (const name of ['src','public','scripts/finalize-export.ts','next.config.ts','tsconfig.json','next-env.d.ts','package.json']) await cp(name,path.join(root,name),{recursive:true});
  await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
  const configPath=path.join(root,'src/config/site.ts');
  await writeFile(configPath,(await readFile(configPath,'utf8')).replace('pcBuilder: false','pcBuilder: true'));
  const fixture=pcFixture(); const data=catalogFixture(); data.products=fixture.products;
  for(const category of ['cpu','gpu','ram'] as const){const original=fixture.products.find(p=>p.category===category)!;data.products.push({...original,id:`${category}-alternative`,slug:`${category}-alternative`,name:`${category} alternativo sintético`,specs:{...original.specs,...(category==='gpu'?{lengthMm:null}:category==='ram'?{type:'DDR4'}:{})} as typeof original.specs});} data.articles=[]; data.offers=[];
  await writeFile(path.join(root,'src/data/pc-configurations.json'),JSON.stringify({schemaVersion:1,configurations:[fixture.configuration,{...fixture.configuration,id:'draft-pc',slug:'draft-pc',status:'draft'}]}));
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
  const listing=await readFile(path.join(root,'out/pcs/index.html'),'utf8'); assert.match(listing,/Configuração sintética/);
  const detail=await readFile(path.join(root,'out/pcs/configuracoes/pc-test/index.html'),'utf8');
  for(const text of ['Compatível nos critérios verificados','Motivo sintético','BIOS mínima','Fontes','Consulte os preços nas lojas']) assert(detail.includes(text));
  await assert.rejects(access(path.join(root,'out/pcs/configuracoes/draft-pc/index.html')));
  const builder=await readFile(path.join(root,'out/pcs/montar/index.html'),'utf8');
  assert.match(builder,/Salvar neste dispositivo/); assert.match(builder,/noindex/);
  if(process.argv.includes('--preview')) { await rm('output/pcs-preview',{recursive:true,force:true}); await cp(path.join(root,'out'),'output/pcs-preview',{recursive:true}); }
  console.log('Export PC isolado aprovado: HTML completo, fontes e regras; drafts ausentes; montador apenas no preview isolado.');
} catch(error) {
  if (error && typeof error === 'object' && 'stdout' in error) console.error(String(error.stdout),String('stderr' in error ? error.stderr : ''));
  throw error;
} finally { await rm(root,{recursive:true,force:true}); }
