import { loadHardware } from '../../../../lib/hardware';
import { ComparisonPage } from '../../../../features/hardware/Catalog';
export const metadata={title:'Comparador de processadores',description:'Especificações, benchmarks comparáveis e custo-benefício pelo preço encontrado.',robots:{index:false,follow:true}};
export default async function Page(){return <ComparisonPage items={(await loadHardware()).filter(i=>i.kind==='cpu')} title="Comparador de processadores" kindLabel="Processador" path="/ferramentas-ti/processadores/"/>;}
