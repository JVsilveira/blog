import Link from 'next/link';
import { loadPhones } from '../../../../lib/phones';
import { HardwareExplorer } from '../../../../features/hardware/Explorer';
import { phoneHardware } from '../../../../features/hardware/phones';
import { loadHardware } from '../../../../lib/hardware';
export const metadata={title:'Comparar celulares e tablets',description:'Comparação factual de até três variantes.',robots:{index:false,follow:true}};
export default async function Page(){
 const [{phones,catalog},hardware]=await Promise.all([loadPhones(),loadHardware()]);
 const today=new Date().toISOString().slice(0,10);
 const items=[...phones.all().map(p=>phoneHardware(p,catalog.products().find(product=>product.id===p.productId)?.name??p.productId,catalog.sources(),today)),...hardware.filter(i=>i.kind==='phone')];
 if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('ID duplicado nos catálogos de celulares');
 return <main id="conteudo" tabIndex={-1} className="blog-page"><Link href="/celulares/">Catálogo de celulares e tablets</Link><h1>Comparar celulares e tablets</h1><HardwareExplorer kind="phone" items={items} kindLabel="Aparelho" path="/celulares/comparar/"/></main>;
}
