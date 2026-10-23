import { ViewMetric } from '../monetization/ViewMetric';
import Link from 'next/link';
import { OfferLink } from './OfferLink';
import Image from 'next/image';
import type { AffiliateOffer, SourceReference } from '../../domain/schemas';
import { presentOffer, formatDate, formatBRL } from '../../domain/offers';
import { methods, type Recommendation } from './model';
const specLabels: Record<string,string> = { socket:'Soquete', powerEstimateW:'Potência estimada (W)', integratedGraphics:'Vídeo integrado', memoryTypes:'Tipos de memória', coolerIncluded:'Cooler incluído', type:'Tipo', kitCount:'Módulos no kit', moduleCapacityGB:'Capacidade por módulo (GB)', formFactor:'Formato', speedMTs:'Velocidade (MT/s)', profileSupport:'Perfis', interface:'Interface', capacityGB:'Capacidade (GB)', slotRequirements:'Requisitos de slot', connectivity:'Conectividade', handedness:'Lateralidade', layout:'Layout', microphone:'Microfone', maxResolution:'Resolução máxima', hostConnector:'Conector de entrada', ports:'Portas', powerDeliveryW:'Power Delivery (W)', wifiStandard:'Padrão Wi-Fi', ethernetPorts:'Portas Ethernet', diagonalInches:'Diagonal (polegadas)', resolution:'Resolução', inputs:'Entradas' };
export function Detail({item,offers,sources,alternatives,now,affiliatesEnabled=false}: {item:Recommendation; offers:AffiliateOffer[]; sources:SourceReference[]; alternatives:Recommendation[]; now:Date; affiliatesEnabled?:boolean}) {
  const {product:p,review:r} = item;
  const archived = p.status === 'archived';
  const links = archived ? [] : offers.map(o => ({offer:o,view:o.lastLinkCheck && Date.parse(o.lastLinkCheck) >= Date.parse(r.updatedAt) && Date.parse(o.lastLinkCheck) <= now.getTime() ? presentOffer(o,now,affiliatesEnabled) : null}));
  return <main id="conteudo" tabIndex={-1} className="blog-page article-body">
    <ViewMetric kind="recommendation" id={p.id}/><nav aria-label="Caminho"><Link href="/recomendacoes/">Recomendações</Link></nav><h1>{p.name}</h1><p>{p.brand} · {methods[r.method]}</p>
    <p>Revisão editorial: <time dateTime={r.updatedAt}>{formatDate(r.updatedAt)}</time>. Dados conferidos em {formatDate(p.verifiedAt!)}.</p>
    {archived && <p className="empty">Produto arquivado. Esta orientação foi preservada como histórico; não há ofertas ativas nesta página. Reavalie as limitações antes de decidir.</p>}
    <p className="intro">{r.summary}</p>
    {p.images.length ? p.images.map(img => <figure key={img.src}><Image src={img.src} alt={img.alt} width={img.width} height={img.height} /><figcaption><a href={img.rightsSource} rel="noopener noreferrer">Origem dos direitos da imagem</a></figcaption></figure>) : <p className="panel">Imagem autorizada não disponível.</p>}
    <h2>Para quem serve</h2><ul>{r.bestFor.map(t => <li key={t}>{t}</li>)}</ul>
    <h2>Pontos favoráveis</h2>{r.pros.length ? <ul>{r.pros.map(t => <li key={t}>{t}</li>)}</ul> : <p>Nenhum ponto favorável documentado.</p>}
    <h2>Limitações</h2><ul>{r.cons.map(t => <li key={t}>{t}</li>)}</ul><h3>Quando evitar</h3><ul>{r.avoidIf.map(t => <li key={t}>{t}</li>)}</ul>
    <h2>Método de avaliação</h2><p>{methods[r.method]}. {r.method === 'hands-on' ? 'Uso confirmado pelo proprietário.' : 'Este método não declara teste pessoal do produto.'}</p>
    <h2>Ficha técnica</h2><dl>{Object.entries(p.specs).filter(([key]) => key !== 'category').map(([key,value]) => <div key={key}><dt>{specLabels[key] ?? key}</dt><dd>{value === null ? 'Não informado' : typeof value === 'boolean' ? value ? 'Sim' : 'Não' : Array.isArray(value) ? value.join(', ') || 'Não informado' : String(value)}</dd></div>)}</dl><p>Informação desconhecida não confirma compatibilidade.</p>
    <h2>Alternativas</h2>{alternatives.length ? <ul>{alternatives.map(a => <li key={a.product.id}><Link href={`/recomendacoes/${a.product.slug}/`}>{a.product.name}</Link> — {a.review.summary}</li>)}</ul> : <p>Nenhuma alternativa verificada disponível.</p>}
    <h2>Onde consultar</h2><p>{links.some(l => l.view?.monetized) ? 'Podemos receber comissão por compras pelos links identificados, sem alterar a ordem editorial.' : 'Não há links monetizados nesta página. Links de loja, quando disponíveis, são comuns.'} <Link href="/afiliados/">Entenda os vínculos comerciais</Link>.</p>
    {!links.some(l => l.view) && <p>Nenhuma oferta verificada disponível.</p>}
    <ul>{links.map(({offer:o,view:v}) => <li key={o.id}>{o.merchant}: {v ? <><OfferLink href={v.href} rel={v.rel} productId={p.id} merchant={v.metricMerchant ?? ''} monetized={v.monetized} /> — {v.monetized ? 'Link de afiliado' : 'Link comum, sem comissão'}{v.disclosure && <p>{v.disclosure}</p>}{v.priceCents !== null && <> · {formatBRL(v.priceCents)}</>}<p>Link conferido em {formatDate(o.lastLinkCheck!)}. Preço e disponibilidade devem ser confirmados na loja.</p></> : 'Link a revisar; consulta indisponível.'}</li>)}</ul>
    <h2>Fontes</h2><ul>{sources.map(s => <li key={s.id}><a href={s.url} rel="noopener noreferrer">{s.publisher}</a> — {s.scope.join('; ')}. Acesso: {formatDate(s.accessedAt)}.</li>)}</ul>
  </main>;
}
