'use client';
import { useEffect, useState, useMemo, useDeferredValue } from 'react';
import {AffiliatePhones} from './AffiliatePhones';
import type {PhoneRanking} from '../../domain/hardware/bestsellers';
import {ProductPhoto} from './ProductPhoto';
import {matchesDevice,type DeviceFilter} from '../../domain/hardware/devices';
import type { Hardware } from '../../domain/hardware/contracts';
import { displaySpecification, hardwareTitle, resolveHardwareIds } from '../../domain/hardware/compare';
import type {StoreLink} from '../../domain/hardware/retailers';
import {comparisonHighlights,highlightValue,sectionLabels} from '../../domain/hardware/highlights';
import {hardwareText} from './i18n';
import {localeTags,type Locale} from '../publication/i18n';
import {ValueAnalysis} from './ValueAnalysis';
import {ModelPicker} from './ModelPicker';
import {createHardwareSearch} from '../../domain/hardware/search';
export type HardwareOption=Pick<Hardware,'id'|'name'|'modelCode'|'variant'|'kind'|'deviceType'|'brand'|'image'>;
export function HardwareComparator({items,kindLabel,path,options=items,onSelection,devices=false,links=[],locale='pt',ranking=null}:{ranking?:PhoneRanking|null;locale?:Locale;items:Hardware[];kindLabel:string;path:string;options?:HardwareOption[];onSelection?:(ids:string[])=>void;devices?:boolean;links?:StoreLink[]}) {
 const t=(text:string)=>hardwareText(text,locale);
 const [query,setQuery]=useState(''),[deviceFilter,setDeviceFilter]=useState<DeviceFilter>('all');
 const [selection,setSelection]=useState<{ids:string[];messages:string[]}>({ids:[],messages:[]});
 const [onlyAffiliate,setOnlyAffiliate]=useState(false);
 const [differences,setDifferences]=useState(false),[share,setShare]=useState('');
 useEffect(()=>{const read=()=>{const next=resolveHardwareIds(new URLSearchParams(location.search).get('modelos')??'',options);setSelection(next);onSelection?.(next.ids);};read();window.addEventListener('popstate',read);return()=>window.removeEventListener('popstate',read);},[options,onSelection]);
 const selected=selection.ids.flatMap(id=>items.find(i=>i.id===id)??[]);
 function update(ids:string[]){const next=resolveHardwareIds(ids.join(','),options);setSelection(next);onSelection?.(next.ids);setShare('');const url=new URL(location.href);url.search='';url.searchParams.set('lang',locale);if(next.ids.length)url.searchParams.set('modelos',next.ids.join(','));history.replaceState(null,'',url);}
 async function copy(){const url=new URL(path,location.origin);url.searchParams.set('lang',locale);url.searchParams.set('modelos',selection.ids.join(','));try{await navigator.clipboard.writeText(url.href);setShare(t('Link copiado.'));}catch{setShare(`${t('Copie este endereço:')} ${url.href}`);}}
 const search=useMemo(()=>createHardwareSearch(options),[options]),deferredQuery=useDeferredValue(query);
 const rows=comparisonHighlights(selected,locale,differences);
 const matches=search(deferredQuery).filter(item=>(!onlyAffiliate||links.some(link=>link.hardwareId===item.id))&&(!devices||matchesDevice(item,deviceFilter)));
 return <div className="comparison-workspace">
 <div className="comparison-search">{devices&&<label>{t('Tipo de aparelho')}<select value={deviceFilter} onChange={e=>{const filter=e.target.value as DeviceFilter;setDeviceFilter(filter);update(selection.ids.filter(id=>options.some(item=>item.id===id&&matchesDevice(item,filter))));}}><option value="all">{t('Celulares e tablets')}</option><option value="phone">{t('Somente celulares')}</option><option value="tablet">{t('Somente tablets')}</option></select></label>}
 <label>{t('Buscar modelo')}<input type="search" placeholder={t('Ex.: S25, Samsung Galaxy ou código do modelo')} value={query} onChange={e=>setQuery(e.target.value)}/></label>
 </div>{links.some(link=>options.some(item=>item.id===link.hardwareId))&&<label className="phone-toggle"><input type="checkbox" checked={onlyAffiliate} onChange={e=>setOnlyAffiliate(e.target.checked)}/>{t('Mostrar apenas modelos com link de afiliado')}</label>}<p>{t('Selecione dois ou três modelos para comparar as especificações principais.')}</p>
 {!options.length?<p className="empty">{t('O catálogo está sendo atualizado. Os modelos aparecerão aqui conforme forem carregados.')}</p>:<div className="model-picker-grid">{Array.from({length:3},(_,index)=><ModelPicker locale={locale} affiliateIds={links.map(link=>link.hardwareId)} key={index} label={`${t(kindLabel)} ${index+1}${index===2?' '+t('(opcional)'):''}`} items={matches} selected={options.find(i=>i.id===selection.ids[index])} disabledIds={selection.ids.filter(id=>id!==selection.ids[index])} onSelect={id=>{const ids=[...selection.ids];if(id)ids[index]=id;else ids.splice(index,1);update(ids.filter(Boolean));}}/>)}</div>}
 <p className="muted">{matches.length} {t('modelos encontrados.')}</p>
 <p role="status">{selection.messages.map(t).join(' ')}</p>
 {selected.length>0&&<><ul className="hardware-selection">{selected.map(item=><li key={item.id}><div className="hardware-device">{item.kind==='phone'&&<ProductPhoto locale={locale} item={item}/>}<span><strong>{item.name}</strong><small>{item.modelCode}</small></span></div> {links.filter(link=>link.hardwareId===item.id).map(link=><p key={link.retailer}><a href={link.href} rel="sponsored noopener noreferrer" target="_blank">{t(link.retailer==='amazon'?'Ver na Amazon':'Ver no Mercado Livre')}</a><small className="comparison-model-code">{t('Link de afiliado. Podemos receber comissão.')}</small></p>)}<button aria-label={`${t('Remover')} ${item.name}`} className="button secondary" onClick={()=>update(selection.ids.filter(id=>id!==item.id))}>{t('Remover')}</button></li>)}</ul><button className="button hardware-clear" onClick={()=>update([])}>{t('Limpar comparação')}</button></>}
 {!devices&&<ValueAnalysis selected={selected} locale={locale}/>}
 {selected.length<2?<p>{t('Escolha ao menos dois modelos para exibir a comparação.')}</p>:<>
 <h2>{t('Especificações principais')}</h2><label className="phone-toggle"><input type="checkbox" checked={differences} onChange={e=>setDifferences(e.target.checked)}/>{t('Mostrar só diferenças')}</label>
 <p id="hardware-scroll">{t('Em telas pequenas, deslize a tabela horizontalmente ou use as setas com a tabela em foco.')}</p>
 <p className="muted">{t('Os rótulos são traduzidos; nomes e descrições técnicas do fabricante podem permanecer no idioma de origem.')}</p>
 {!rows.length?<p role="status">{t(differences?'Nenhuma diferença confirmada nos campos disponíveis.':'Nenhuma especificação principal disponível para esta seleção.')}</p>:<div className="phone-table-scroll" role="region" aria-label={t('Ficha comparativa')} aria-describedby="hardware-scroll" tabIndex={0}><table className="phone-table"><caption>{t('Especificações por modelo e variante. Campos ausentes são indicados como não confirmados.')}</caption><thead><tr><th scope="col">{t('Característica')}</th>{selected.map(item=><th key={item.id} scope="col">{item.name}<small className="comparison-model-code">{item.modelCode}</small></th>)}</tr></thead>{Object.entries(sectionLabels).map(([section,labels])=>{const groupRows=rows.filter(row=>row.section===section);return groupRows.length?<tbody key={section}><tr className="comparison-section"><th colSpan={selected.length+1} scope="rowgroup">{labels[locale]}</th></tr>{groupRows.map(row=><tr key={row.id}><th scope="row">{row.label}</th>{row.values.map((spec,index)=><td key={selected[index]!.id}>{highlightValue(spec,locale)}{spec&&<small className="phone-sources"><a href={spec.source.url} rel="noopener noreferrer">{spec.source.publisher}</a> · {t('consultado em')} {new Date(spec.source.accessedAt).toLocaleDateString(localeTags[locale],{timeZone:'UTC'})}</small>}</td>)}</tr>)}</tbody>:null;})}</table></div>}

 <details className="comparison-sources"><summary>{t('Fontes e limitações')}</summary>{selected.map(item=><section key={item.id}><h3>{hardwareTitle(item)}</h3><p>{t('Ficha')}: <a href={item.source.url}>{item.source.publisher}</a>. <a href={item.source.licenseUrl}>{item.source.license}</a>.</p><ul>{item.limitations.map((limit,index)=><li key={index}>{limit}</li>)}</ul>{item.benchmarks.map(b=><p key={b.id}>{b.suite} {b.version}: {displaySpecification(b.score)} {b.unit}; {b.workload}; plataforma {b.platform}; configuração {b.settings}; protocolo {b.protocol}; medido em {new Date(b.measuredAt).toLocaleDateString(localeTags[locale],{timeZone:'UTC'})}. <a href={b.source.url}>Fonte: {b.source.publisher}</a>. <a href={b.source.licenseUrl}>{b.source.license}</a>.</p>)}</section>)}
 </details><button className="button" onClick={copy}>{t('Copiar link da comparação')}</button><p role="status">{share}</p>
 </>}
 {devices&&<AffiliatePhones items={options} links={links} ranking={ranking} locale={locale} selectedIds={selection.ids} onSelect={id=>update([...selection.ids,id])}/>}
 <noscript>Ative JavaScript para selecionar e comparar modelos. As fichas do catálogo e suas fontes continuam disponíveis sem JavaScript.</noscript>
 </div>;
}
