import { loadPublicContent } from '../../../lib/content';
import { recommendations } from '../../../features/recommendations/model';
import { Catalog } from '../../../features/recommendations/Catalog';
import { listingMetadata } from '../../../features/blog/metadata';
export const metadata = listingMetadata('Recomendações com contexto', 'Curadoria editorial com método, fontes e limitações para escolher com segurança.', '/recomendacoes/');
export default async function Page() {
  const repo = await loadPublicContent();
  return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>Recomendações com contexto</h1><p className="intro">Conheça o método, o uso indicado e as limitações antes de escolher.</p><Catalog items={recommendations(repo.products(),repo.reviews())} /></main>;
}
