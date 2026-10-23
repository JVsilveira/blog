import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from './fixtures/catalog';
import { loadContent } from '../src/lib/content';
import { createPublicRepository } from '../src/lib/catalog';
import { validateEditorial, validateOperations, markdownDestinations } from '../src/lib/editorial';

it('cadastro CLI draft → bloqueio sem aprovação → published somente em fixture temporária', async () => {
  const root = await mkdtemp(path.join(tmpdir(),'portal-editorial-'));
  try {
    for (const dir of ['src/content/articles','src/data','src/app/ajuda','docs/editorial']) await mkdir(path.join(root,dir),{recursive:true});
    await cp('templates',path.join(root,'templates'),{recursive:true});
    await writeFile(path.join(root,'src/app/ajuda/page.tsx'),'');
    for (const [file,key] of [['phones.json','variants'],['pc-configurations.json','configurations']]) await writeFile(path.join(root,'src/data',file!),JSON.stringify({schemaVersion:1,[key!]:[]}));
    const {articles,...catalog} = fixture();
    catalog.authors[0]!.id = 'joao';
    await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog));
    const cli = () => execFileSync(process.execPath,['--import',path.resolve('node_modules/tsx/dist/loader.mjs'),path.resolve('scripts/editorial-new.ts'),'cadastro-controlado'],{cwd:root,stdio:'pipe'});
    cli();
    const file = path.join(root,'src/content/articles/cadastro-controlado/article.json');
    const original = await readFile(file,'utf8');
    expect(() => cli()).toThrow();
    expect(await readFile(file,'utf8')).toBe(original);
    const ops = {schemaVersion:1, records:[{kind:'article',id:'cadastro-controlado',owner:'Responsável sintético',reviewer:null as string | null,nextReviewAt:null,note:'Fixture: não representa revisão real.'},{kind:'product',id:'product-test',owner:'Responsável sintético',reviewer:'Revisor sintético',nextReviewAt:null,note:'Fixture.'}]};
    await writeFile(path.join(root,'docs/editorial/controle.json'),JSON.stringify(ops));
    const draft = await loadContent(root);
    await validateEditorial(root,draft);
    expect(createPublicRepository(draft).articles()).toHaveLength(0);
    const metadata = JSON.parse(original);
    await writeFile(path.join(root,'src/content/articles/cadastro-controlado/body.md'),'Corpo sintético exclusivo do exercício controlado.');
    Object.assign(metadata,{title:'Título sintético',description:'Resumo sintético',category:'Teste',status:'published',sourceIds:['source-test'],publishedAt:metadata.createdAt});
    await writeFile(file,JSON.stringify(metadata));
    await expect(loadContent(root)).rejects.toThrow(/aprovação/);
    metadata.ownerApprovedAt = metadata.createdAt; // SIMULAÇÃO: nunca é aprovação editorial humana.
    await writeFile(file,JSON.stringify(metadata));
    const published = await loadContent(root);
    await expect(validateEditorial(root,published)).rejects.toThrow(/revisor/);
    ops.records[0]!.reviewer = 'Revisor sintético';
    await writeFile(path.join(root,'docs/editorial/controle.json'),JSON.stringify(ops));
    await validateEditorial(root,published);
    expect(createPublicRepository(published).articleBySlug(metadata.slug)).not.toBeNull();
    const validateCLI = () => execFileSync(process.execPath,['--import',path.resolve('node_modules/tsx/dist/loader.mjs'),path.resolve('scripts/validate-content.ts')],{cwd:root,stdio:'pipe'});
    for (const body of ['[Link local quebrado](/nao-existe/)', '[Relativo](../)', '![Sem direitos](https://example.org/imagem.png)', '[HTTP](http://example.org/)']) {
      await writeFile(path.join(root,'src/content/articles/cadastro-controlado/body.md'),body);
      await expect(validateEditorial(root,await loadContent(root))).rejects.toThrow(/body.md:/);
      expect(() => validateCLI()).toThrow();
    }
    await writeFile(path.join(root,'src/content/articles/cadastro-controlado/body.md'),'[Ajuda][ref]\n\n[ref]: /ajuda/');
    await validateEditorial(root,await loadContent(root));
    catalog.products[0]!.specs = {...catalog.products[0]!.specs, powerEstimateW:-1} as never;
    await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog));
    await expect(loadContent(root)).rejects.toThrow();
    expect(() => validateCLI()).toThrow();
    expect(articles.length).toBe(1);
  } finally { await rm(root,{recursive:true,force:true}); }
});
it('controle rejeita duplicatas, órfãos e ausência de proprietário', () => {
  const data = fixture();
  expect(() => validateOperations({schemaVersion:1,records:[]},data)).toThrow(/proprietário/);
  const record = {kind:'product',id:'product-test',owner:'Fixture',reviewer:null as string | null,nextReviewAt:null,note:'Fixture'};
  expect(() => validateOperations({schemaVersion:1,records:[record]},data)).toThrow(/revisor/);
  const reviewed = {...record,reviewer:'Fixture'};
  expect(() => validateOperations({schemaVersion:1,records:[reviewed,reviewed]},data)).toThrow(/duplicado/);
  expect(() => validateOperations({schemaVersion:1,records:[{...record,id:'orfao'}]},data)).toThrow(/inexistente/);
});
it('parser encontra links de referência e ignora exemplos de código', () => {
  expect(markdownDestinations('`[exemplo](/quebrado/)`\n\n[Guia][ref]\n\n[ref]: /ajuda/')).toEqual([{url:'/ajuda/',image:false}]);
});
