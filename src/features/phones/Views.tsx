import Link from "next/link";
import { PhoneOfferLink } from './OfferLink';
import type { Phone, Field } from '../../domain/phones/contracts';
import { labels } from '../../domain/phones/contracts';
import type { SourceReference, AffiliateOffer } from '../../domain/schemas';
import { display, title, comparisonRows } from '../../domain/phones/compare';
import { formatDate, presentOffer, formatBRL } from '../../domain/offers';
import { site } from '../../config/site';
export function FieldSources({phone,field,sources}: {phone:Phone;field:Field;sources:SourceReference[]}) {
  return <small className="phone-sources">{(phone.sourceIds[field]??[]).map(id=>{const s=sources.find(s=>s.id===id);return s ? <span key={id}><a href={s.url} rel="noopener noreferrer">{s.publisher}</a> · acesso {formatDate(s.accessedAt)}. </span> : null;})}Conferência: {phone.verifiedAt ? formatDate(phone.verifiedAt) : 'Não confirmado'}.</small>;
}
export function PhoneEditorial({phone,sources,level=3}: {phone:Phone;sources:SourceReference[];level?:2|3}) {
  const e=phone.editorial;
  const Heading=level===2?'h2':'h3';
  const Subheading=level===2?'h3':'h4';
  if(!e) return <p>Resumo editorial não disponível.</p>;
  return <section><Heading>Orientação de uso</Heading><p>{e.method==='hands-on'?'Uso confirmado pelo proprietário':'Análise documental; não declara teste pessoal'}. Revisão: {formatDate(phone.updatedAt)}.</p><p>{e.summary}</p><Subheading>Para quem serve</Subheading><ul>{e.bestFor.map(t=><li key={t}>{t}</li>)}</ul><Subheading>Limitações</Subheading><ul>{e.limitations.map(t=><li key={t}>{t}</li>)}</ul><p>Fontes do resumo: {e.sourceIds.map(id=>{const s=sources.find(s=>s.id===id);return s?<span key={id}><a href={s.url}>{s.publisher}</a> (acesso {formatDate(s.accessedAt)}). </span>:null;})}</p></section>;
}
export function PhoneTable({phones,names,sources,today,onlyDifferences=false}: {phones:Phone[];names:Record<string,string>;sources:SourceReference[];today:string;onlyDifferences?:boolean}) {
  return <><p id="phone-scroll-help">Em telas pequenas, deslize a tabela horizontalmente ou use as setas com a tabela em foco. Campos desconhecidos permanecem visíveis.</p><div className="phone-table-scroll" role="region" aria-label="Ficha comparativa" aria-describedby="phone-scroll-help" tabIndex={0}><table className="phone-table"><caption>Especificações documentadas por variante. Não constituem nota de qualidade.</caption><thead><tr><th scope="col">Característica</th>{phones.map(p=><th key={p.id} scope="col">{title(p,names[p.productId]??p.productId)}</th>)}</tr></thead><tbody>{comparisonRows(phones,onlyDifferences).map(f=><tr key={f}><th scope="row">{labels[f]}</th>{phones.map(p=><td key={p.id}>{display(p,f,today)}<FieldSources phone={p} field={f} sources={sources}/></td>)}</tr>)}</tbody></table></div></>;
}
export function PhoneOffers({phone,offers,now}: {phone:Phone;offers:AffiliateOffer[];now:Date}) {
  const links=offers.map(o=>({o,v:o.lastLinkCheck && Date.parse(o.lastLinkCheck)>=Date.parse(phone.updatedAt)&&Date.parse(o.lastLinkCheck)<=now.getTime()?presentOffer(o,now,site.features.affiliates):null}));
  return <section><h2>Onde consultar</h2><p>{links.some(l=>l.v?.monetized)?'Podemos receber comissão pelos links identificados.':'Links de loja, quando disponíveis, são comuns, sem comissão.'} <Link href="/afiliados/">Vínculos comerciais</Link>.</p>{!links.some(l=>l.v)&&<p>Consulta indisponível: nenhuma oferta verificada para esta variante.</p>}<ul>{links.map(({o,v})=><li key={o.id}>{o.merchant}: {v?<><PhoneOfferLink href={v.href} rel={v.rel} productId={phone.productId} merchant={v.metricMerchant ?? ''} monetized={v.monetized}/> — {v.monetized?'Link de afiliado':'Link comum'}{v.disclosure && <p>{v.disclosure}</p>}{v.priceCents!==null&&` · ${formatBRL(v.priceCents)}`} · conferido em {formatDate(o.lastLinkCheck!)}</>:'Link a revisar; consulta indisponível.'}</li>)}</ul></section>;
}
