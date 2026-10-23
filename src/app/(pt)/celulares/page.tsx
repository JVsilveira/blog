import Link from 'next/link';
import { loadHardware } from '../../../lib/hardware';
import { HardwareCatalog } from '../../../features/hardware/Catalog';
import { loadPhones } from '../../../lib/phones';
import { PhoneCatalog } from '../../../features/phones/Controls';
import { listingMetadata } from '../../../features/blog/metadata';
export const metadata=listingMetadata('Celulares e tablets por variante','Fichas verificadas e comparação factual orientada ao uso.','/celulares/');
export default async function Page(){const [{phones,catalog},hardware]=await Promise.all([loadPhones(),loadHardware()]);const names=Object.fromEntries(catalog.products().map(p=>[p.id,p.name]));return <main id="conteudo" tabIndex={-1} className="blog-page article-body"><h1>Celulares e tablets: compare para o seu uso</h1><p>Conheça a variante, confira as fontes e considere os limites antes de escolher. Sem nota automática ou vencedor universal.</p><Link href="/celulares/comparar/">Comparar duas ou três variantes</Link>{(phones.all().length || !hardware.some(i=>i.kind==='phone')) ? <PhoneCatalog phones={phones.all()} names={names}/> : null}<HardwareCatalog items={hardware.filter(i=>i.kind==='phone')} path="/celulares/comparar/"/></main>;}
