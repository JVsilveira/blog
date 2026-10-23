import { loadPublicContent } from '../../../lib/content';
import { Listing } from '../../../features/blog/Listing';
import { BlogSearch } from '../../../features/blog/Search';
import { listingMetadata } from '../../../features/blog/metadata';
export const metadata = listingMetadata('Ajuda e guias de compra', 'Guias de suporte e decisões de compra com fontes, contexto e limitações.', '/ajuda/');
export default async function Help() {
  const repo = await loadPublicContent();
  return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>Ajuda e guias de compra</h1><p className="intro">Encontre contexto para resolver problemas e escolher com segurança.</p><BlogSearch /><section aria-labelledby="lista-guias"><h2 id="lista-guias">Guias publicados</h2><Listing articles={repo.articles().filter(a=>(a.kind ?? 'blog')==='blog')} /></section></main>;
}
