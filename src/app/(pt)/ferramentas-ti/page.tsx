import Link from 'next/link';
import { listingMetadata } from '../../../features/blog/metadata';
export const metadata=listingMetadata('Ferramentas TI','Orçamentos de serviços e comparação de celulares, tablets, processadores e memória RAM.','/ferramentas-ti/');
export default function Page(){return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>Ferramentas TI</h1><div className="tool-directory">
 <section><h2><Link href="/para-tecnicos/orcamentos/">Orçamento de TI</Link></h2><p>Monte o orçamento dos seus serviços.</p></section>
 <section><h2><Link href="/celulares/comparar/">Comparador de celulares e tablets</Link></h2><p>Confira variantes, especificações e custo-benefício.</p></section>
 <section><h2><Link href="/ferramentas-ti/processadores/">Comparador de processadores</Link></h2><p>Compare fichas técnicas, benchmarks equivalentes e o preço encontrado.</p></section>
 <section><h2><Link href="/ferramentas-ti/memoria-ram/">Comparador de memória RAM</Link></h2><p>Compare kits, especificações e desempenho medido na mesma plataforma.</p></section>
 </div></main>;}
