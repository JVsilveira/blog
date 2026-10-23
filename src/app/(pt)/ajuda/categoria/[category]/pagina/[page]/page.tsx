import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../../../../lib/content';
import { Listing } from '../../../../../../../features/blog/Listing';
import { categorySlug, paginate, PAGE_SIZE } from '../../../../../../../features/blog/model';
import { listingMetadata } from '../../../../../../../features/blog/metadata';
type Params = {category:string; page:string};
export async function generateStaticParams() {
  const all = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog');
  const params = [...new Set(all.map(a => categorySlug(a.category)))].flatMap(category => Array.from({length: Math.max(0, Math.ceil(all.filter(a => categorySlug(a.category) === category).length / PAGE_SIZE) - 1)}, (_,i) => ({category, page:String(i+2)})));
  return params.length ? params : [{category:'sem-publicacao',page:'0'}];
}
export async function generateMetadata({params}:{params:Promise<Params>}) { const p = await params; const a = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog').find(a => categorySlug(a.category) === p.category); if (!a || (a.kind ?? 'blog')!=='blog') notFound(); return listingMetadata(`${a.category} — página ${p.page}`, `Página ${p.page} dos guias de ${a.category}.`, `/ajuda/categoria/${p.category}/pagina/${p.page}/`); }
export default async function Page({params}:{params:Promise<Params>}) {
  const p = await params;
  const articles = (await loadPublicContent()).articles().filter(a=>(a.kind ?? 'blog')==='blog').filter(a => categorySlug(a.category) === p.category);
  if (!articles.length || !/^[1-9]\d*$/.test(p.page) || Number(p.page) < 2 || !paginate(articles,Number(p.page))) notFound();
  return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>{articles[0]!.category} — página {p.page}</h1><Listing articles={articles} category={articles[0]!.category} page={Number(p.page)} /></main>;
}
