import type { Article } from '../../domain/schemas';
import { normalize } from '../blog/model';
import type { PublicationKind } from './i18n';
export const matchesPublicationKind = (article:Pick<Article,'kind'>,kind?:PublicationKind) => !kind || (kind==='blog' ? (article.kind ?? 'blog')==='blog' : article.kind==='news' || article.kind==='opinion');
export function orderedPublications(articles:Article[]) {
 return [...articles].sort((a,b)=>Number((a.kind??'blog')==='blog')-Number((b.kind??'blog')==='blog') || (a.featuredOrder ?? Infinity)-(b.featuredOrder ?? Infinity) || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.slug.localeCompare(b.slug));
}
export function filterPublications<T extends {title:string;description:string;category:string}>(entries:T[],term:string,category:string) {
 const words=normalize(term).trim().split(/\s+/).filter(Boolean);
 return entries.filter(a=>(!category || normalize(a.category)===normalize(category)) && words.every(word=>normalize([a.title,a.description,a.category].join(' ')).includes(word)));
}
import { type Locale, publicationPath, homePath } from './i18n';
export function localizeArticle(article:Article,locale:Locale):Article|null {
 if(locale==='pt')return article;
 const translation=article.translations?.find(t=>t.language===locale && t.status==='published' && t.reviewedAt && t.sourceUpdatedAt===article.updatedAt);
 return translation ? {...article,title:translation.title,description:translation.description,body:translation.body,methodology:translation.methodology,limitations:translation.limitations,updatedAt:translation.reviewedAt!}:null;
}
export function articleLanguages(article:Article) {
 const links:Partial<Record<Locale,string>>={pt:publicationPath(article.slug,'pt',article.kind)};
 for(const locale of ['en','es'] as const)if(localizeArticle(article,locale))links[locale]=publicationPath(article.slug,locale,article.kind);
 return links;
}
export const homeLanguages = {pt:homePath('pt'),en:homePath('en'),es:homePath('es')};
