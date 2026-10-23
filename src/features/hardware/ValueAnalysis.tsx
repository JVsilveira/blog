'use client';
import {useState} from 'react';
import type {Hardware} from '../../domain/hardware/contracts';
import {hardwareText} from './i18n';
import {localeTags,type Locale} from '../publication/i18n';
import {analyzeValue,benchmarkChoices,inputPriceCents,displaySpecification} from '../../domain/hardware/compare';
export function ValueAnalysis({selected,locale='pt'}:{selected:Hardware[];locale?:Locale}){
 const t=(text:string)=>hardwareText(text,locale);
 const [currency,setCurrency]=useState('BRL'),[prices,setPrices]=useState<Record<string,string>>({}),[extras,setExtras]=useState<Record<string,string>>({}),[test,setTest]=useState('');
 const choices=benchmarkChoices(selected);
 const selectedKey=choices.some(c=>c.key===test)?test:choices[0]?.key??'';
 const cost=Object.fromEntries(selected.map(i=>[i.id,inputPriceCents(prices[i.id]??'')]));
 const extra=Object.fromEntries(selected.map(i=>[i.id,extras[i.id]?.trim()&&!/^0([.,]0{1,2})?$/.test(extras[i.id]!.trim())?inputPriceCents(extras[i.id]!)??-1:0]));
 const analysis=analyzeValue(selected,selectedKey,cost,extra);
 const money=(cents:number)=>new Intl.NumberFormat(localeTags[locale],{style:'currency',currency}).format(cents/100);
 const names=(ids:string[])=>ids.map(id=>selected.find(i=>i.id===id)!.name).join(', ');
 return selected.length<2?null:( <section className="value-analysis" aria-labelledby="value-heading"><h2 id="value-heading">{t('Desempenho e custo-benefício')}</h2>
 <p>{t('A conclusão vale para o teste escolhido e os preços que você encontrou. Não é uma nota geral de qualidade.')}</p>
 <label>{t('Moeda dos preços')}<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="BRL">BRL — Real</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
 <div className="comparison-prices">{selected.map(item=><fieldset key={item.id}><legend>{item.name} — {item.variant}</legend><label>{t('Preço encontrado para')} {item.name} ({currency})<input type="text" inputMode="decimal" maxLength={12} placeholder="Ex.: 1299,90" value={prices[item.id]??''} onChange={e=>setPrices({...prices,[item.id]:e.target.value})}/></label><label>{t('Custos adicionais para')} {item.name} ({currency})<input type="text" inputMode="decimal" maxLength={12} placeholder={t('Opcional')} value={extras[item.id]??''} onChange={e=>setExtras({...extras,[item.id]:e.target.value})}/></label></fieldset>)}</div>
 <p><small>{t('Sem separador de milhar. Inclua frete, taxas e eventual troca de placa-mãe ou outros componentes nos custos adicionais. Preços ficam só nesta tela, sem envio ou armazenamento.')}</small></p>
 {choices.length>0&&<label>{t('Teste de desempenho')}<select value={selectedKey} onChange={e=>setTest(e.target.value)}>{choices.map(({key,benchmark:b})=><option key={key} value={key}>{b.suite} {b.version} — {b.workload} — {b.platform} — {b.settings} ({b.unit})</option>)}</select></label>}
 <div role="status">{analysis.ready?<><p><strong>{t('Melhor custo-benefício neste teste:')} {names(analysis.winnerIds)}.</strong></p><p>{t('Maior desempenho medido neste teste:')} {names(analysis.performanceIds)}.</p><ul>{analysis.rows.map(row=><li key={row.id}>{selected.find(i=>i.id===row.id)!.name}: {displaySpecification(row.score)}; {t('custo total informado')} {money(row.totalCents)}; {t('desempenho por unidade monetária')} {displaySpecification(row.value*100)}.</li>)}</ul><p>{t('Fórmula: resultado ÷ custo total para testes em que maior é melhor; 1 ÷ (tempo ou latência × custo total) quando menor é melhor. Empates não recebem vencedor exclusivo.')}</p></>:<p>{t(analysis.reason)}</p>}</div>
 <p>{t('GHz, núcleos, capacidade de RAM, MT/s, mAh e megapixels isolados não determinam o melhor produto. Confirme compatibilidade, consumo e o seu uso antes de comprar.')}</p>
 </section>);
}
