import type { Metadata } from 'next';
import type { Article, SourceReference } from '../../domain/schemas';
import { site } from '../../config/site';
import { staticSeoPaths } from '../../config/seo';

export function pageRobots(path?: string): Metadata['robots'] {
  const index = !!site.origin && site.seo.indexingApproved &&
    (!path || !(staticSeoPaths as readonly string[]).includes(path) || site.seo.approvedPaths.includes(path));
  return {
    index, follow: !!site.origin && site.seo.indexingApproved,
    ...(index ? { 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 } : {}),
  };
}
export function listingMetadata(title: string, description: string, path: string, origin: string | null = site.origin): Metadata {
  const url = origin ? new URL(path, origin).href : undefined;
  const images = origin ? [{url: new URL('/og-blog.png', origin).href, width:1200, height:630, alt:site.name}] : undefined;
  return {
    title, description, robots: pageRobots(path),
    ...(url ? {alternates:{canonical:url}} : {}),
    openGraph:{title, description, type:'website', locale:'pt_BR', siteName:site.name, ...(url ? {url, images} : {})},
    twitter: {card:'summary_large_image', title, description, ...(images ? {images: images.map(image => image.url)} : {})},
  };
}
export function articleMetadata(a: Article, origin: string | null = site.origin, author?: string): Metadata {
  const metadata = listingMetadata(a.title, a.description, `/ajuda/${a.slug}/`, origin);
  return {
    ...metadata,
    ...(author ? {authors:[{name:author}]} : {}),
    openGraph: {...metadata.openGraph, type:'article', publishedTime:a.publishedAt!, modifiedTime:a.updatedAt, section:a.category, tags:a.tags},
  };
}
export function articleStructuredData(a: Article, author: string, origin: string | null = site.origin, sources: SourceReference[] = []) {
  if (!origin) return null;
  const url = new URL(`/ajuda/${a.slug}/`, origin).href;
  return [{
    '@context':'https://schema.org', '@type':'BlogPosting', '@id':url+'#article', url,
    headline:a.title, description:a.description, inLanguage:'pt-BR',
    datePublished:a.publishedAt, dateModified:a.updatedAt,
    articleSection:a.category, keywords:a.tags,
    author:{'@type':'Person', name:author}, mainEntityOfPage:url,
    publisher:{'@type':'Organization',name:site.name,url:new URL('/',origin).href,logo:{'@type':'ImageObject',url:new URL('/brand/silfontech-logo.svg',origin).href,width:2050,height:470}},
    isPartOf:{'@type':'WebSite', '@id':new URL('/#website', origin).href, name:site.name, url:new URL('/', origin).href},
    ...(sources.length ? {citation:sources.filter(s => a.sourceIds.includes(s.id)).map(s => ({'@type':'CreativeWork', url:s.url, name:s.publisher}))} : {}),
  }, {
    '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[
      {'@type':'ListItem', position:1, name:'Início', item:new URL('/',origin).href},
      {'@type':'ListItem', position:2, name:'Ajuda', item:new URL('/ajuda/',origin).href},
      {'@type':'ListItem', position:3, name:a.title, item:url},
    ],
  }] as const;
}
export function websiteStructuredData() {
  if (!site.origin) return null;
  return {'@context':'https://schema.org', '@type':'WebSite', '@id':new URL('/#website',site.origin).href, url:new URL('/',site.origin).href, name:site.name, inLanguage:'pt-BR'};
}
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
