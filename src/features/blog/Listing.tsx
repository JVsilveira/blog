import Link from 'next/link';
import type { Article } from '../../domain/schemas';
import { categorySlug, paginate } from './model';
export function Listing({ articles, page = 1, category }: { articles: Article[]; page?: number; category?: string }) {
  const result = paginate(articles, page);
  if (!result) return null;
  const categories = [...new Set(articles.map(a => a.category))];
  const base = category ? `/ajuda/categoria/${categorySlug(category)}/` : '/ajuda/';
  return <>
    {!category && categories.length > 0 && <nav className="topic-nav" aria-label="Categorias"><ul>{categories.map(c => <li key={c}><Link href={`/ajuda/categoria/${categorySlug(c)}/`}>{c}</Link></li>)}</ul></nav>}
    {result.items.length ? <div className="guide-list">{result.items.map(a => <article className="editorial-card" key={a.slug}><p>{a.category}</p><h2><Link href={`/ajuda/${a.slug}/`}>{a.title}</Link></h2><p>{a.description}</p></article>)}</div> : <p className="empty">Ainda não há conteúdo revisado disponível.</p>}
    {result.count > 1 && <nav aria-label="Páginas de guias"><ul className="pagination">{Array.from({ length: result.count }, (_, i) => i + 1).map(n => <li key={n}>{n === page ? <span aria-current="page">Página {n}</span> : <Link href={n === 1 ? base : `${base}pagina/${n}/`}>Página {n}</Link>}</li>)}</ul></nav>}
  </>;
}
