'use client';
import storefront from '../../data/affiliate-storefront.json';
import {affiliatePhones,type PhoneRanking} from '../../domain/hardware/bestsellers';
import type {StoreLink} from '../../domain/hardware/retailers';
import type {HardwareOption} from './Comparator';
import type {Locale} from '../publication/i18n';
import {localeTags} from '../publication/i18n';
import {hardwareText} from './i18n';
import {ProductPhoto} from './ProductPhoto';
export function AffiliatePhones({items,links,ranking,locale,selectedIds,onSelect}:{items:HardwareOption[];links:StoreLink[];ranking:PhoneRanking|null;locale:Locale;selectedIds:string[];onSelect:(id:string)=>void}){
 const t=(text:string)=>hardwareText(text,locale),phones=affiliatePhones(items,links,ranking),ranked=phones.filter(p=>p.position!==null),others=phones.filter(p=>p.position===null);
 function cards(list:typeof phones){return <ul className="affiliate-phones">{list.map(({item,link,position})=><li key={item.id}><ProductPhoto small decorative locale={locale} item={item}/><div>{position!==null&&<p className="affiliate-rank">#{position} · {t('Mais vendidos no Mercado Livre')}</p>}<h3>{item.name}</h3><p className="muted">{item.modelCode}</p><div className="affiliate-phone-actions"><button className="button" disabled={selectedIds.includes(item.id)||selectedIds.length>=3} onClick={()=>onSelect(item.id)}>{t(selectedIds.includes(item.id)?'Na comparação':'Adicionar à comparação')}</button><a href={link.href} target="_blank" rel="sponsored noopener noreferrer">{t('Ver no Mercado Livre')}</a></div></div></li>)}</ul>;}
 return <section className="affiliate-section" aria-labelledby="affiliate-heading"><div className="affiliate-heading"><div><h2 id="affiliate-heading">{t('Mais vendidos')}</h2><p>{t('Veja os produtos na minha vitrine do Mercado Livre.')}</p></div><a className="button secondary" href={storefront.href} target="_blank" rel="sponsored noopener noreferrer">{t('Abrir minha vitrine')}</a></div>
 <p className="muted">{t('Link de afiliado. Podemos receber comissão.')}</p>
 {ranked.length?<><p>{t('Posições do ranking de celulares do Mercado Livre, entre os modelos com link de afiliado cadastrado.')}{ranking?.updatedAt&&<> {t('Atualizado em')} {new Date(ranking.updatedAt).toLocaleDateString(localeTags[locale],{timeZone:'UTC'})}</>}. </p>{cards(ranked)}<a href="https://www.mercadolivre.com.br/mais-vendidos/MLB1055" target="_blank" rel="noopener noreferrer">{t('Fonte do ranking')}</a></>:<p className="affiliate-empty">{t('O ranking de celulares ainda não está disponível. Você pode consultar os produtos diretamente na vitrine.')}</p>}
 {others.length>0&&<><h3>{t('Celulares com link de afiliado')}</h3>{cards(others)}</>}
 </section>;
}
