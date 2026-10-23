import { articleLanguages, localizeArticle } from "../features/publication/model";
import { copy, sections } from "../features/publication/i18n";
import { sectionPath } from "../features/publication/PortalPage";
import { PAGE_SIZE, categorySlug } from '../features/blog/model';
import { loadPhones } from '../lib/phones';
import type { MetadataRoute } from 'next';
import { loadPCs } from '../lib/pcs';
import { site } from '../config/site';
import { staticSeoPaths } from '../config/seo';
import { loadPublicContent } from '../lib/content';
export const dynamic = 'force-static';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin: string | null = site.origin;
  if (!origin || !site.seo.indexingApproved) return [];
  const repo = await loadPublicContent();
  const {configurations}=await loadPCs();
  const {phones}=await loadPhones();
  const staticPaths=staticSeoPaths;
  const articlePaths:string[]=[];
  const articles=repo.articles().filter(a=>(a.kind ?? 'blog')==='blog');
  for(let page=2;page<=Math.ceil(articles.length/PAGE_SIZE);page++) articlePaths.push(`/ajuda/pagina/${page}/`);
  for(const category of new Set(articles.map(a=>a.category))) {
    const base=`/ajuda/categoria/${categorySlug(category)}/`; articlePaths.push(base);
    for(let page=2;page<=Math.ceil(articles.filter(a=>a.category===category).length/PAGE_SIZE);page++) articlePaths.push(`${base}pagina/${page}/`);
  }
  return [...articlePaths.map(p=>({url:new URL(p,origin).href})), ...staticPaths.filter(p=>site.seo.approvedPaths.includes(p)).map(p=>({url:new URL(p,origin).href})), ...phones.all().map(p=>({url:new URL(`/celulares/${p.slug}/`,origin).href,lastModified:p.updatedAt})), ...configurations.all().map(c=>({url:new URL(`/pcs/configuracoes/${c.slug}/`,origin).href,lastModified:c.updatedAt})), ...repo.articles().flatMap(a => Object.entries(articleLanguages(a)).map(([locale,path])=>({url:new URL(path,origin).href,lastModified:locale==='pt'?a.updatedAt:localizeArticle(a,locale as 'en'|'es')!.updatedAt,alternates:{languages:Object.fromEntries(Object.entries(articleLanguages(a)).map(([key,path])=>[key==='pt'?'pt-BR':key,new URL(path,origin).href]))}}))),
    ...(['pt','en','es'] as const).flatMap(locale=>sections.filter(section=>repo.articles().some(a=>a.category.toLocaleLowerCase('pt-BR')===copy.pt[section].toLocaleLowerCase('pt-BR')&&localizeArticle(a,locale))).map(section=>({url:new URL(sectionPath(section,locale),origin).href}))), ...repo.recommendationProducts().filter(p => repo.reviews().some(r => r.productId === p.id)).map(p => ({url:new URL(`/recomendacoes/${p.slug}/`,origin).href,lastModified:p.updatedAt}))];
}
