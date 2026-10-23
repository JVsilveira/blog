import { cp, mkdtemp, mkdir, writeFile, rm, readFile, access, symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fixture } from '../tests/fixtures/catalog';
const root = await mkdtemp(path.join(tmpdir(), 'portal-blog-export-'));
try {
  for (const name of ['src','public','next.config.ts','tsconfig.json','next-env.d.ts','package.json']) await cp(name, path.join(root,name), {recursive:true});
  await symlink(path.resolve('node_modules'), path.join(root,'node_modules'), 'dir');
  const data = fixture();
  const article = data.articles[0]!;
  data.articles = Array.from({length:8}, (_,i) => ({...article, id:`fixture-${i}`, slug:`fixture-${i}`, title:`Guia sintético de conexão ${i}`, description:`Resumo sintético ${i}`, tags:['áudio'], body:'## Contexto\n\nCorpo exclusivo da fixture.\n\n1. Passo sintético\n2. Verificação sintética\n\n```txt\nexemplo\n```'}));
  data.articles[0]!.translations=['en','es'].map(language=>({language:language as 'en'|'es',status:'published' as const,title:language==='en'?'Synthetic English headline':'Titular sintético en español',description:language==='en'?'English synthetic summary':'Resumen sintético en español',body:language==='en'?'## English context\n\nEnglish translated body for test.':'## Contexto en español\n\nTexto traducido sintético para pruebas.',methodology:'Synthetic translation methodology',limitations:'Only for isolated tests',sourceUpdatedAt:article.updatedAt,reviewedAt:article.updatedAt}));
  data.articles[2]!.translations=[{...data.articles[0]!.translations![0]!,title:'Stale translation must not be published',sourceUpdatedAt:'2026-09-01T00:00:00Z'}];
  data.articles[7]!.featuredOrder=1;data.articles[7]!.kind='opinion';data.articles[7]!.category='Política';
  data.articles.push({...article,id:'news-fixture',slug:'news-fixture',kind:'news',category:'Economia',title:'Notícia sintética para teste',description:'Resumo sintético da notícia de teste',body:'Conteúdo sintético usado exclusivamente no teste de export.'});
  data.articles.push({...article,id:'draft-fixture',slug:'draft-fixture',status:'draft'});
  const {articles,...catalog} = data;
  await writeFile(path.join(root,'src/data/catalog.json'),JSON.stringify(catalog));
  await rm(path.join(root,'src/content/articles'),{recursive:true});
  for (const {body,...metadata} of articles) {
    const folder = path.join(root,'src/content/articles',metadata.slug);
    await mkdir(folder,{recursive:true}); await writeFile(path.join(folder,'article.json'),JSON.stringify(metadata)); await writeFile(path.join(folder,'body.md'),body);
  }
  execFileSync(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:root,stdio:'pipe',env:{...process.env,NEXT_PUBLIC_SITE_URL:'https://portal.example',NEXT_PUBLIC_SITE_INDEXING:'true',NEXT_PUBLIC_SEO_APPROVED_PATHS:'/,/ajuda/,/en/,/es/'}});
  await rm(path.join(root,'out/ajuda/pagina/0'),{recursive:true,force:true});
  const html = await readFile(path.join(root,'out/ajuda/fixture-0/index.html'),'utf8');
  assert.match(html, /Corpo exclusivo da fixture/); assert.match(html, /<ol>/); assert.match(html, /Autor de fixture/);
  for (const route of ['ajuda/pagina/2','ajuda/categoria/teste','ajuda/categoria/teste/pagina/2']) assert.match(await readFile(path.join(root,'out',route,'index.html'),'utf8'), /Guia sintético/);
  await assert.rejects(access(path.join(root,'out/ajuda/draft-fixture/index.html')));
  const index = JSON.parse(await readFile(path.join(root,'out/indice-busca.json'),'utf8'));
  assert.equal(index.length,9); assert(!JSON.stringify(index).includes('draft-fixture'));
  assert.match(html, /rel="canonical" href="https:\/\/portal\.example\/ajuda\/fixture-0\/"/);
  assert.match(html, /name="robots" content="index, follow/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const structured = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match => JSON.parse(match[1]!));
  assert.equal(structured[0][0]['@type'], 'BlogPosting');
  assert.equal(structured[0][0].inLanguage, 'pt-BR');
  assert.equal(structured[0][0].author.name, 'Autor de fixture');
  assert(structured[0][0].citation.length > 0);
  const sitemap = await readFile(path.join(root,'out/sitemap.xml'),'utf8');
  assert.match(sitemap, /https:\/\/portal\.example\/ajuda\/fixture-0\//);
  assert(!/draft-fixture|sem-publicacao|comparar|montar|orcamentos/.test(sitemap));
  assert.match(await readFile(path.join(root,'out/robots.txt'),'utf8'), /Allow: \//);
  const about = await readFile(path.join(root,'out/sobre/index.html'),'utf8');
  assert.match(about, /name="robots" content="noindex, follow/);
  for(const [locale,headline] of [['en','Synthetic English headline'],['es','Titular sintético en español']] as const) {
    const translated=await readFile(path.join(root,`out/${locale}/articles/fixture-0/index.html`),'utf8');
    assert.match(translated,new RegExp(`<html lang="${locale}"`));
    assert(translated.includes(headline));
    assert.match(translated,/hrefLang="pt-BR"/i);
    assert.match(translated,/hrefLang="en"/i);
    assert.match(translated,/hrefLang="es"/i);
    assert.match(translated,new RegExp(`rel="canonical" href="https://portal.example/${locale}/articles/fixture-0/"`));
    await assert.rejects(access(path.join(root,`out/${locale}/articles/fixture-2/index.html`)));
  }
  assert.match(sitemap,/xhtml:link/);
  assert(!sitemap.includes('/en/articles/fixture-2/'));
  const home=await readFile(path.join(root,'out/index.html'),'utf8');
  const listing=await readFile(path.join(root,'out/noticias/index.html'),'utf8');
  for(const page of [home,listing]) {
    const articleLinks=[...page.matchAll(/<h2><a href="([^"]+)"/g)].map(match=>match[1]);
    assert.deepEqual(articleLinks.slice(0,2),['/publicacoes/fixture-7/','/publicacoes/news-fixture/']);
    assert(page.includes('publication-lead'));
    assert(!page.includes('Política, esporte, economia e tecnologia. Informação com fontes e opinião identificada.</p>'));
  }
  assert.match(listing, /Todas as categorias/);
  const legacy=await readFile(path.join(root,'out/opiniao/index.html'),'utf8');
  assert.match(legacy,/rel="canonical" href="https:\/\/portal\.example\/noticias\/"/);
  const opinion=await readFile(path.join(root,'out/publicacoes/fixture-7/index.html'),'utf8');
  assert.match(opinion,/OpinionNewsArticle/);assert.match(opinion,/Este texto expressa a opinião do autor/);
  const news=await readFile(path.join(root,'out/publicacoes/news-fixture/index.html'),'utf8');
  assert.match(news,/NewsArticle/);assert(!news.includes('Este texto expressa a opinião do autor'));
  await assert.rejects(access(path.join(root,'out/ajuda/fixture-7/index.html')));
  const seoReport = JSON.parse(execFileSync(process.execPath, ['--import','tsx',path.resolve('scripts/check-seo.ts'),'--production'], {cwd:root,encoding:'utf8'}));
  assert.equal(seoReport.artigosIndexaveis,11);
  assert.deepEqual(seoReport.pendencias,[]);
  if (process.argv.includes('--preview')) {
    await rm('output/blog-preview',{recursive:true,force:true});
    await cp(path.join(root,'out'),'output/blog-preview',{recursive:true});
  }
  console.log('Export isolado aprovado: artigo em HTML, duas páginas globais/categoria, índice com 9 publicados, notícia/opinião, EN/ES e hreflang, draft ausente, canonical, BlogPosting/fontes, sitemap e indexação seletiva.');
} catch (error) {
  if (error && typeof error === 'object' && 'stdout' in error) console.error(String(error.stdout), String('stderr' in error ? error.stderr : ''));
  throw error;
} finally { await rm(root,{recursive:true,force:true}); }
