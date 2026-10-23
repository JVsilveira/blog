import { publicationMetadata, publicationStructuredData } from "../../../../features/publication/metadata";
import { recommendations } from '../../../../features/recommendations/model';
import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../lib/content';
import { ArticleView } from '../../../../features/blog/ArticleView';
import { safeJson } from '../../../../features/blog/metadata';
export async function generateStaticParams() { const params = (await loadPublicContent()).articleParams(); return params.length ? params : [{slug:'sem-publicacao'}]; }
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) {
  const repo = await loadPublicContent();
  const a = repo.articleBySlug((await params).slug);
  if (!a || (a.kind ?? 'blog')!=='blog') notFound();
  return publicationMetadata(a, "pt", repo.authors().find(author => author.id === a.authorId)!.name);
}
export default async function Page({ params }: { params: Promise<{slug:string}> }) {
  const repo = await loadPublicContent();
  const a = repo.articleBySlug((await params).slug);
  if (!a || (a.kind ?? 'blog')!=='blog') notFound();
  const author = repo.authors().find(author => author.id === a.authorId)!.name;
  const data = publicationStructuredData(a, "pt", author, repo.sources());
  return <>{data && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson(data)}} />}<ArticleView products={recommendations(repo.recommendationProducts(),repo.reviews()).filter(item => a.relatedProductIds.includes(item.product.id))} article={a} author={author} sources={repo.sources().filter(s => a.sourceIds.includes(s.id))} related={repo.articles().filter(a=>(a.kind ?? 'blog')==='blog').filter(r => r.slug !== a.slug && (r.category === a.category || r.tags.some(t => a.tags.includes(t)))).slice(0,3)} /></>;
}
