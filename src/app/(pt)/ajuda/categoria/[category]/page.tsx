import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../../lib/content';
import { Listing } from '../../../../../features/blog/Listing';
import { listingMetadata } from '../../../../../features/blog/metadata';
import { categorySlug } from '../../../../../features/blog/model';
export async function generateStaticParams() { const params = [...new Set((await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog').map(a => categorySlug(a.category)))].map(category => ({ category })); return params.length ? params : [{category:'sem-publicacao'}]; }
export async function generateMetadata({ params }: { params: Promise<{category: string}> }) {
  const { category } = await params;
  const article = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog').find(a => categorySlug(a.category) === category);
  if (!article) notFound(); return listingMetadata(article.category, `Guias publicados sobre ${article.category}.`, `/ajuda/categoria/${category}/`);
}
export default async function Category({ params }: { params: Promise<{category: string}> }) {
  const { category } = await params;
  const articles = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog').filter(a => categorySlug(a.category) === category);
  if (!articles.length) notFound();
  return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>{articles[0]!.category}</h1><Listing articles={articles} category={articles[0]!.category} /></main>;
}
