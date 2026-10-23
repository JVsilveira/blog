import { afterEach, expect, it } from 'vitest';
import { fixture } from './fixtures/catalog';
import { createPublicRepository, validateCatalog } from '../src/lib/catalog';
import { localizeArticle, articleLanguages } from '../src/features/publication/model';
import { preferredLocale } from '../src/features/publication/i18n';
import { publicationMetadata, publicationStructuredData } from '../src/features/publication/metadata';
import { site } from '../src/config/site';
const originalOrigin=site.origin;
afterEach(()=>Object.assign(site,{origin:originalOrigin}));
function translated() {
 const a=fixture().articles[0]!;
 return {...a,kind:'opinion' as const,category:'Política',translations:[{
  language:'en' as const,status:'published' as const,title:'Synthetic opinion for testing',description:'Synthetic summary, not real news.',body:'Synthetic opinion text for an isolated test.',methodology:'Synthetic source analysis',limitations:'Not a real news story',reviewedAt:a.updatedAt,sourceUpdatedAt:a.updatedAt,
 }]};
}
it('reconhece preferência de idioma, variantes regionais e ordem do visitante sem usar país por IP',()=>{
 expect(preferredLocale(['en-GB','pt-BR'])).toBe('en');
 expect(preferredLocale(['fr-CA','es-MX'])).toBe('es');
 expect(preferredLocale(['pt-PT'])).toBe('pt');
 expect(preferredLocale(['de-DE'])).toBe('pt');
});
it('opinião e notícia preservam autoria e fontes e não criam tradução ausente',()=>{
 const article=translated();
 expect(localizeArticle(article,'en')?.authorId).toBe(article.authorId);
 expect(localizeArticle(article,'en')?.sourceIds).toEqual(article.sourceIds);
 expect(localizeArticle(article,'es')).toBeNull();
 expect(articleLanguages(article)).toEqual({pt:'/publicacoes/article-test/',en:'/en/articles/article-test/'});
});
it('fronteira pública remove traduções em draft, sem revisão ou desatualizadas e não publica original draft',()=>{
 const data=fixture();data.articles=[translated()];
 data.articles[0]!.translations!.push({...translated().translations[0]!,language:'es',status:'draft',reviewedAt:null});
 expect(createPublicRepository(data).articles()[0]!.translations).toHaveLength(1);
 data.articles[0]!.translations![0]!.sourceUpdatedAt='2026-09-01T12:00:00Z';
 expect(createPublicRepository(data).articles()[0]!.translations).toHaveLength(0);
 data.articles[0]!.status='draft';expect(createPublicRepository(data).articles()).toEqual([]);
});
it('validação recusa tradução duplicada, publicação incompleta e HTML em traduções',()=>{
 const data=fixture();data.articles=[translated()];
 data.articles[0]!.translations!.push(translated().translations[0]!);
 expect(()=>validateCatalog(data)).toThrow(/duplicada/);
 data.articles[0]!.translations=[{...translated().translations[0]!,reviewedAt:null}];
 expect(()=>validateCatalog(data)).toThrow(/revisão/);
 data.articles[0]!.translations=[{...translated().translations[0]!,body:'<script>alert(1)</script>'}];
 expect(()=>validateCatalog(data)).toThrow(/HTML/);
});
it('canonicals e hreflang apontam só para versões equivalentes disponíveis; marca opinião no JSON-LD',()=>{
 Object.assign(site,{origin:'https://portal.example'});
 const a=translated();const metadata=publicationMetadata(a,'en','Autor sintético');
 expect(metadata.alternates?.canonical).toBe('https://portal.example/en/articles/article-test/');
 expect(metadata.alternates?.languages).toEqual({'pt-BR':'https://portal.example/publicacoes/article-test/',en:'https://portal.example/en/articles/article-test/'});
 const graph=publicationStructuredData(a,'en','Autor sintético',fixture().sources)!;
 expect(graph[0]).toMatchObject({'@type':'OpinionNewsArticle',inLanguage:'en',headline:'Synthetic opinion for testing'});
 expect(publicationStructuredData({...a,kind:'news'},'pt','Autor sintético',[])![0]).toMatchObject({'@type':'NewsArticle'});
});

it('reúne notícia e opinião, prioriza destaques e mantém desempate estável por data',async()=>{
 const {matchesPublicationKind,orderedPublications,filterPublications}=await import('../src/features/publication/model');
 const original=fixture().articles[0]!;
 const blog={...original,slug:'blog',kind:'blog' as const,featuredOrder:1};
 const news={...original,slug:'news',kind:'news' as const,category:'Economia',featuredOrder:2};
 const opinion={...original,slug:'opinion',kind:'opinion' as const,category:'Política',featuredOrder:1};
 const newer={...news,slug:'newer',featuredOrder:null,publishedAt:'2026-10-23T12:00:00Z'};
 expect(orderedPublications([blog,newer,news,opinion]).map(a=>a.slug)).toEqual(['opinion','news','newer','blog']);
 expect([blog,news,opinion].filter(a=>matchesPublicationKind(a,'news')).map(a=>a.slug)).toEqual(['news','opinion']);
 expect([blog,news,opinion].filter(a=>matchesPublicationKind(a,'opinion')).map(a=>a.slug)).toEqual(['news','opinion']);
 expect(orderedPublications([{...news,featuredOrder:2}, {...newer,featuredOrder:2}]).map(a=>a.slug)).toEqual(['newer','news']);
 expect(filterPublications([news,opinion],'','politica')).toEqual([opinion]);
 expect(filterPublications([news,opinion],'inexistente','Política')).toEqual([]);
 expect([blog,newer,news,opinion].map(a=>a.slug)).toEqual(['blog','newer','news','opinion']);
});
