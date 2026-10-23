import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../../lib/content';
import { Listing } from '../../../../../features/blog/Listing';
import { listingMetadata } from '../../../../../features/blog/metadata';
import { paginate, PAGE_SIZE } from '../../../../../features/blog/model';
export async function generateStaticParams() {
  const articles = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog');
  const params = Array.from({ length: Math.max(0, Math.ceil(articles.length / PAGE_SIZE) - 1) }, (_, i) => ({ page: String(i + 2) }));
  return params.length ? params : [{page:'0'}];
}
export async function generateMetadata({ params }: { params: Promise<{page: string}> }) { const {page} = await params; return listingMetadata(`Guias — página ${page}`, `Página ${page} dos guias publicados de suporte e compra.`, `/ajuda/pagina/${page}/`); }
export default async function Page({ params }: { params: Promise<{page: string}> }) {
  const { page } = await params;
  const articles = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog');
  if (!/^[2-9]\d*$|^1\d+$/.test(page) || !paginate(articles, Number(page))) notFound();
  return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>Guias — página {page}</h1><Listing articles={articles} page={Number(page)} /></main>;
}
