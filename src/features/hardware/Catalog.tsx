import type { Hardware } from '../../domain/hardware/contracts';
import { specificationDisplay, hardwareTitle } from '../../domain/hardware/compare';
import { ProductPhoto } from './ProductPhoto';
import { HardwareExplorer } from './Explorer';
export function HardwareCatalog({items,path}:{items:Hardware[];path:string}) {
 return items.length?<div className="hardware-catalog">{items.map(item=><details key={item.id}><summary>{hardwareTitle(item)}</summary>{item.kind==='phone'&&<ProductPhoto item={item}/>}<p><a href={`${path}?modelos=${item.id}`}>Comparar este modelo</a></p><dl>{item.specifications.map(s=><div key={s.key}><dt>{s.group}: {s.label}{s.unit?` (${s.unit})`:''}</dt><dd>{specificationDisplay(s)} — <a href={s.source.url}>{s.source.publisher}</a></dd></div>)}</dl><p><a href={item.source.url}>Fonte da ficha: {item.source.publisher}</a>. <a href={item.source.licenseUrl}>{item.source.license}</a>.</p></details>)}</div>:null;
}
export function ComparisonPage({items,title,kindLabel,path}:{items:Hardware[];title:string;kindLabel:string;path:string}){
 return <main id="conteudo" tabIndex={-1} className="blog-page"><h1>{title}</h1><HardwareExplorer kind={path.includes('processadores')?'cpu':'ram'} items={items} kindLabel={kindLabel} path={path}/><h2>Catálogo e fichas técnicas</h2>{!items.length?<p>Catálogo em atualização automática.</p>:<HardwareCatalog items={items} path={path}/>}</main>;
}
