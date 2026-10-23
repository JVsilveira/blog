import { loadHardware } from '../../../../lib/hardware';
import { ComparisonPage } from '../../../../features/hardware/Catalog';
export const metadata={title:'Comparador de memória RAM',description:'Kits de memória, especificações, benchmarks e custo-benefício pelo preço encontrado.',robots:{index:false,follow:true}};
export default async function Page(){return <ComparisonPage items={(await loadHardware()).filter(i=>i.kind==='ram')} title="Comparador de memória RAM" kindLabel="Memória RAM" path="/ferramentas-ti/memoria-ram/"/>;}
