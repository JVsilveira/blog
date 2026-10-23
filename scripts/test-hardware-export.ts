import {cp,mkdtemp,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {hardwareFixture} from '../tests/fixtures/hardware';
const root=await mkdtemp(path.join(tmpdir(),'portal-hardware-export-'));
try{
 for(const name of ['src','public','next.config.ts','tsconfig.json','next-env.d.ts','package.json'])await cp(name,path.join(root,name),{recursive:true});
 await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 const items=[...hardwareFixture('cpu'),...hardwareFixture('ram'),...hardwareFixture('phone')];
 items[0]!.specifications[0]!.displayValue='16 GB (apresentação revisada de teste)';
 await writeFile(path.join(root,'src/data/hardware.json'),JSON.stringify({schemaVersion:1,items:[...items,{...items[0],id:'draft-hardware',status:'draft',reviewedAt:null}]}));
 execFileSync(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,stdio:'pipe'});
 execFileSync(process.execPath,['--import','tsx',path.resolve('scripts/finalize-export.ts')],{cwd:root,stdio:'pipe'});
 const home=await readFile(path.join(root,'out/index.html'),'utf8');
 for(const text of ['Notícias','Guias','Ferramentas TI','Recomendações'])assert(home.includes(text));
 for(const [route,label] of [['ferramentas-ti/processadores','Processador sintético'],['ferramentas-ti/memoria-ram','Memória sintético'],['celulares/comparar','Celular sintético']]){
  const html=await readFile(path.join(root,'out',route!,'index.html'),'utf8');
  assert(html.includes(label!));if(route==='celulares/comparar'){assert(!/<h2[^>]*>Fichas técnicas<\/h2>/.test(html));assert(html.includes('Abrir minha vitrine'));assert(html.includes('https://www.mercadolivre.com.br/social/dossantossilveirajoovitor'));assert(html.includes('O ranking de celulares ainda não está disponível.'));}else{assert(html.includes('Recurso ausente'));assert(html.includes('Não confirmado'));assert(html.includes('Fonte sintética de testes'));}assert(!html.includes('draft-hardware'));assert.match(html,/name="robots" content="noindex/);
 }
 assert((await readFile(path.join(root,'out/ferramentas-ti/processadores/index.html'),'utf8')).includes('16 GB (apresentação revisada de teste)'));
 const tools=await readFile(path.join(root,'out/ferramentas-ti/index.html'),'utf8');for(const link of ['/para-tecnicos/orcamentos/','/celulares/comparar/','/ferramentas-ti/processadores/','/ferramentas-ti/memoria-ram/'])assert(tools.includes(link));
 if(process.argv.includes('--preview')){await rm('output/hardware-preview',{recursive:true,force:true});await cp(path.join(root,'out'),'output/hardware-preview',{recursive:true});}
 console.log('Export de hardware isolado aprovado: navegação, ferramentas, fichas sem JS, campos desconhecidos, fontes, draft ausente e comparadores noindex.');
}catch(error){if(error&&typeof error==='object'&&'stdout' in error)console.error(String(error.stdout),String('stderr' in error?error.stderr:''));throw error;}finally{await rm(root,{recursive:true,force:true});}
