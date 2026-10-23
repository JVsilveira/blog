import Link from 'next/link';
import { site } from '../../../../config/site';
import { loadPCs } from '../../../../lib/pcs';
import { Builder } from '../../../../features/pc-builder/Builder';
export const metadata={title:'Montar PC',robots:{index:false,follow:true}};
export default async function Page(){
  const {repo}=await loadPCs();
  const products=repo.products().filter(p=>['cpu','motherboard','ram','gpu','storage','psu','case','cooler'].includes(p.category));
  return <main id="conteudo" tabIndex={-1} className="blog-page article-body"><Link href="/pcs/">Configurações editoriais</Link><h1>Montar PC</h1>{site.features.pcBuilder&&products.length?<Builder products={products} sources={repo.sources()} offers={products.flatMap(p=>repo.offersFor(p.id))} affiliates={site.features.affiliates} today={new Date().toISOString()}/>:<section className="empty"><h2>Montador indisponível</h2><p>O catálogo de componentes e suas evidências aguardam revisão editorial. Nenhuma compatibilidade é presumida.</p></section>}</main>;
}
