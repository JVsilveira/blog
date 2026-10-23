import type { Metadata } from 'next';
import type { Article } from '../../domain/schemas';
import { site } from '../../config/site';
import { listingMetadata, articleMetadata, articleStructuredData } from '../blog/metadata';
import { copy, localeTags, homePath, publicationPath, type Locale, type PublicationKind } from './i18n';
import { articleLanguages, homeLanguages, localizeArticle, matchesPublicationKind } from './model';
import { loadPublicContent } from '../../lib/content';
function alternates(paths:Partial<Record<Locale,string>>) {
 if(!site.origin)return undefined;
 return Object.fromEntries(Object.entries(paths).map(([key,path])=>[localeTags[key as Locale],new URL(path,site.origin!).href]));
}
export function editionMetadata(locale:Locale):Metadata {
 const c=copy[locale],title=`${site.name} | ${c.heading}`;const metadata=listingMetadata(title,c.intro,homePath(locale));
 return {...metadata,title:{absolute:title},alternates:{...metadata.alternates,languages:site.origin?{...alternates(homeLanguages),'x-default':new URL('/',site.origin).href}:undefined},openGraph:{...metadata.openGraph,locale:locale==='pt'?'pt_BR':locale==='en'?'en_US':'es_ES'}};
}
export async function collectionMetadata(locale:Locale,title:string,path:string,kind?:PublicationKind,section?:string):Promise<Metadata> {
 const articles=(await loadPublicContent()).articles().filter(a=>matchesPublicationKind(a,kind)&&(!section||a.category.toLocaleLowerCase('pt-BR')===copy.pt[section as keyof typeof copy.pt]?.toLocaleLowerCase('pt-BR'))&&localizeArticle(a,locale));
 if(kind==='opinion'){title=copy[locale].news;path=locale==='pt'?'/noticias/':`/${locale}/news/`;}
 const base=listingMetadata(title,`${title}. ${copy[locale].intro}`,path);
 return {...base,...(!articles.length?{robots:{index:false,follow:!!site.origin&&site.seo.indexingApproved}}:{}),openGraph:{...base.openGraph,locale:localeTags[locale]}};
}
export function publicationMetadata(original:Article,locale:Locale,author:string):Metadata {
 const article=localizeArticle(original,locale)!;const base=articleMetadata(article,site.origin,author);
 const path=publicationPath(original.slug,locale,original.kind);
 const url=site.origin?new URL(path,site.origin).href:undefined;
 return {...base,alternates:site.origin?{canonical:url,languages:alternates(articleLanguages(original))}:undefined,
  openGraph:{...base.openGraph,locale:localeTags[locale],...(url?{url}:{})}};
}
export function publicationStructuredData(original:Article,locale:Locale,author:string,sources:Parameters<typeof articleStructuredData>[3]) {
 const article=localizeArticle(original,locale)!;const graph=articleStructuredData(article,author,site.origin,sources);
 if(!graph||!site.origin)return null;
 const url=new URL(publicationPath(original.slug,locale,original.kind),site.origin).href;
 return [{...graph[0], '@type':original.kind==='news'?'NewsArticle':original.kind==='opinion'?'OpinionNewsArticle':'BlogPosting', '@id':url+'#article',url,mainEntityOfPage:url,inLanguage:localeTags[locale],isPartOf:{'@type':'WebSite',name:site.name,url:new URL(homePath(locale),site.origin).href}},
 {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:copy[locale].home,item:new URL(homePath(locale),site.origin).href},{'@type':'ListItem',position:2,name:article.title,item:url}]}];
}
