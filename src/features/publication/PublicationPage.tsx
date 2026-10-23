import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../lib/content';
import { ArticleView } from '../blog/ArticleView';
import { safeJson } from '../blog/metadata';
import { localizeArticle } from './model';
import { publicationStructuredData } from './metadata';
import type { Locale } from './i18n';
export async function PublicationPage({slug,locale}:{slug:string;locale:Locale}) {
 const repo=await loadPublicContent();const original=repo.articleBySlug(slug);
 if(!original)notFound();const article=localizeArticle(original,locale);if(!article)notFound();
 const author=repo.authors().find(a=>a.id===article.authorId)!.name;
 const sources=repo.sources().filter(s=>article.sourceIds.includes(s.id));
 const data=publicationStructuredData(original,locale,author,sources);
 return <>{data&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(data)}}/>}<ArticleView article={article} original={original} locale={locale} author={author} sources={sources} related={[]}/></>;
}
