import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { fixture } from './fixtures/catalog';
import { searchArticles, paginate, categorySlug } from '../src/features/blog/model';
import { ArticleView } from '../src/features/blog/ArticleView';
import { articleMetadata, articleStructuredData, safeJson } from '../src/features/blog/metadata';
import { validateCatalog } from '../src/lib/catalog';
it('busca tolera acentos e caixa, procura tags e combina categoria', () => {
  const a = {...fixture().articles[0]!, title:'Conexão e reuniões', tags:['áudio'], category:'Home office'};
  expect(searchArticles([a], 'CONEXAO')).toEqual([a]);
  expect(searchArticles([a], 'audio')).toEqual([a]);
  expect(searchArticles([a], 'audio', 'Outra')).toEqual([]);
  expect(searchArticles([a], 'ausente')).toEqual([]);
  expect(categorySlug('Windows e computador')).toBe('windows-e-computador');
});
it('pagina ordenadamente sem perder registros e rejeita páginas inválidas', () => {
  const items = Array.from({length:14}, (_,i) => ({...fixture().articles[0]!,slug:`article-${String(i).padStart(2,'0')}`}));
  expect(paginate(items,1)?.count).toBe(3);
  expect([1,2,3].flatMap(p => paginate(items,p)!.items)).toHaveLength(14);
  expect(new Set([1,2,3].flatMap(p => paginate(items,p)!.items.map(a => a.slug))).size).toBe(14);
  for (const page of [0,4,1.5,NaN]) expect(paginate(items,page)).toBeNull();
});
it('renderiza corpo, passos, fontes, autoria e sumário no HTML sem JS', () => {
  const data = fixture(); const a = {...data.articles[0]!, body:'## Contexto\n\nTexto **visível**.\n\n1. Primeiro passo\n2. Verifique o resultado\n\n```txt\nexemplo\n```'};
  const html = renderToStaticMarkup(createElement(ArticleView,{article:a,author:'Autor de fixture',sources:data.sources,related:[]}));
  expect(html).toContain('<strong>visível</strong>'); expect(html).toContain('<ol>'); expect(html).toContain('href="#secao-1"'); expect(html).toContain('id="secao-1"'); expect(html).toContain('Fixture sintética'); expect(html).toContain('Copiar código');
});
it('não fabrica canonical e serializa JSON-LD seguro apenas com origem', () => {
  const a = fixture().articles[0]!;
  expect(articleMetadata(a).alternates).toBeUndefined(); expect(articleStructuredData(a,'João')).toBeNull();
  expect(articleMetadata(a,'https://example.org').alternates?.canonical).toBe('https://example.org/ajuda/article-test/');
  expect(safeJson(articleStructuredData({...a,title:'</script>'},'João','https://example.org'))).not.toContain('</script>');
});
it('fontes e revisão são barreiras para publicação', () => {
  const data = fixture(); data.articles[0]!.sourceIds = [];
  expect(() => validateCatalog(data)).toThrow(/fontes/);
  const other = fixture(); other.articles[0]!.ownerApprovedAt = null;
  expect(() => validateCatalog(other)).toThrow(/aprovação/);
});
it('rejeita metadados públicos repetidos e categorias ambíguas', () => {
  const data = fixture(); data.articles.push({...data.articles[0]!,id:'outro',slug:'outro'});
  expect(() => validateCatalog(data)).toThrow(/únicos/);
  data.articles[1]!.title = 'Outro título'; data.articles[1]!.description = 'Outro resumo';
  data.articles[0]!.category = 'Conexão'; data.articles[1]!.category = 'Conexao';
  expect(() => validateCatalog(data)).toThrow(/ambíguo/);
});
it('ignora headings em blocos de código e remove destinos perigosos do Markdown', () => {
  const data = fixture();
  const html = renderToStaticMarkup(createElement(ArticleView,{article:{...data.articles[0]!,body:'```txt\n## Não é seção\n```\n\n[Perigo](javascript:alert)\n\n[Credencial](https://user:pass@example.org)'},author:'Fixture',sources:[],related:[]}));
  expect(html).not.toContain('Neste guia'); expect(html).not.toContain('href="javascript'); expect(html).not.toContain('href="https://user');
});
