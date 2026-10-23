import { afterEach, expect, it } from 'vitest';
import { seoConfiguration } from '../src/config/seo';
import { site } from '../src/config/site';
import robots from '../src/app/robots';
import { articleMetadata, articleStructuredData, listingMetadata } from '../src/features/blog/metadata';
import { fixture } from './fixtures/catalog';
const previous = {origin:site.origin, seo:site.seo};
afterEach(() => Object.assign(site,previous));
it('bloqueia configuração local, origem insegura e rotas não revisáveis', () => {
  expect(seoConfiguration()).toEqual({origin:null, seo:{indexingApproved:false,approvedPaths:[]}});
  expect(() => seoConfiguration(undefined,'true')).toThrow();
  for (const origin of ['http://portal.example','https://localhost','https://127.0.0.1','https://portal.example/blog','https://u:p@portal.example','https://portal.example/?x=1'])
    expect(() => seoConfiguration(origin)).toThrow();
  expect(() => seoConfiguration('https://portal.example','yes')).toThrow();
  expect(() => seoConfiguration('https://portal.example','true','/admin/')).toThrow();
  expect(() => seoConfiguration('https://portal.example','true','/ajuda/?q=teste')).toThrow();
  expect(seoConfiguration('https://portal.example/','true','/, /ajuda/,/')).toEqual({origin:'https://portal.example',seo:{indexingApproved:true,approvedPaths:['/','/ajuda/']}});
});
it('domínio sozinho não libera indexação e páginas estáticas exigem revisão própria', () => {
  Object.assign(site,seoConfiguration('https://portal.example'));
  expect(robots().rules).toEqual({userAgent:'*',disallow:'/'});
  expect(listingMetadata('Título','Descrição','/').robots).toMatchObject({index:false});
  Object.assign(site,seoConfiguration('https://portal.example','true','/,/ajuda/'));
  expect(listingMetadata('Título','Descrição','/').robots).toMatchObject({index:true,'max-image-preview':'large'});
  expect(listingMetadata('Título','Descrição','/contato/').robots).toMatchObject({index:false,follow:true});
  expect(robots().rules).toMatchObject({userAgent:'*',allow:'/'});
  expect(robots().sitemap).toBe('https://portal.example/sitemap.xml');
});
it('artigo identifica autoria, língua e fontes públicas, sem perfil privado ou afirmação inventada', () => {
  const data = fixture();
  const article = data.articles[0]!;
  const metadata = articleMetadata(article,'https://portal.example','Autor de fixture');
  expect(metadata.authors).toEqual([{name:'Autor de fixture'}]);
  expect(metadata.twitter).toMatchObject({card:'summary_large_image'});
  const graph = articleStructuredData(article,'Autor de fixture','https://portal.example',data.sources)!;
  expect(graph[0]).toMatchObject({'@type':'BlogPosting', inLanguage:'pt-BR', dateModified:article.updatedAt});
  expect(graph[0].citation).toEqual(data.sources.filter(s => article.sourceIds.includes(s.id)).map(s => ({'@type':'CreativeWork',url:s.url,name:s.publisher})));
  expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|googleusercontent|gmail.com|SearchAction/);
});

it('libera produção Pages no domínio próprio e impede indexação herdada em prévias',async()=>{
 const {publicBuildEnvironment}=await import('../src/config/deployment');
 expect(publicBuildEnvironment({}).NEXT_PUBLIC_SITE_INDEXING).toBeUndefined();
 const production=publicBuildEnvironment({CF_PAGES:'1',CF_PAGES_BRANCH:'main'});
 expect(production.NEXT_PUBLIC_SITE_URL).toBe('https://silfontech.com.br');
 expect(production.NEXT_PUBLIC_SITE_INDEXING).toBe('true');
 expect(production.NEXT_PUBLIC_SEO_APPROVED_PATHS).toContain('/noticias/');
 expect(production.NEXT_PUBLIC_SEO_APPROVED_PATHS).not.toContain('/contato/');
 const preview=publicBuildEnvironment({...production,CF_PAGES:'1',CF_PAGES_BRANCH:'feature/test'});
 expect(preview.NEXT_PUBLIC_SITE_INDEXING).toBe('false');expect(preview.NEXT_PUBLIC_SEO_APPROVED_PATHS).toBe('');
 expect(publicBuildEnvironment({...production,NEXT_PUBLIC_SITE_INDEXING:'false'}).NEXT_PUBLIC_SITE_INDEXING).toBe('false');
});
it('sitemap de coleções exige publicação real e tradução disponível, sem alias duplicado',async()=>{
 const {sitemapCollectionAvailable}=await import('../src/features/publication/model');
 const a={...fixture().articles[0]!,kind:'news' as const};
 expect(sitemapCollectionAvailable('/noticias/',[])).toBe(false);
 expect(sitemapCollectionAvailable('/noticias/',[{...a,status:'draft'}])).toBe(false);
 expect(sitemapCollectionAvailable('/noticias/',[a])).toBe(true);
 expect(sitemapCollectionAvailable('/blog/',[a])).toBe(false);
 expect(sitemapCollectionAvailable('/en/news/',[a])).toBe(false);
 expect(sitemapCollectionAvailable('/opiniao/',[a])).toBe(false);
});
