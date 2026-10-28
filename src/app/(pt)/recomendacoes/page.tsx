import { loadPublicContent } from '../../../lib/content';
import { recommendations } from '../../../features/recommendations/model';
import { Catalog } from '../../../features/recommendations/Catalog';
import { listingMetadata } from '../../../features/blog/metadata';
import {OfferShowcase} from '../../../features/recommendations/OfferShowcase';
import feed from '../../../data/recommendations.json';
import {recommendationFeedSchema} from '../../../domain/recommendation-feed';
import '../../../styles/recommendations.css';
export const metadata = listingMetadata('Recomendações e ofertas', 'Produtos selecionados e ofertas do Mercado Livre, com preços consultados, características e links de afiliado.', '/recomendacoes/');
export default async function Page() {
  const repo = await loadPublicContent();
  const editorial=recommendations(repo.products(),repo.reviews());
  return <main id="conteudo" tabIndex={-1} className="recommendations-page"><header className="offers-hero"><div><h1>Recomendações</h1><p>Encontre produtos e confira as ofertas do Mercado Livre.</p></div><svg viewBox="0 0 80 80" width="80" height="80" fill="none" aria-hidden="true"><path d="M14 16h32l24 24-30 30-26-26V16Z" stroke="currentColor" strokeWidth="2"/><circle cx="28" cy="30" r="4" stroke="currentColor" strokeWidth="2"/><path d="m36 52 16-16M38 37h.01M51 51h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></header><OfferShowcase initialItems={recommendationFeedSchema.parse(feed).items}/>{editorial.length>0&&<section className="editorial-recommendations"><h2>Análises e recomendações editoriais</h2><p>Conheça o método, o uso indicado e as limitações antes de escolher.</p><Catalog items={editorial}/></section>}</main>;
}
