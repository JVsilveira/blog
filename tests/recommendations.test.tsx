import { affiliatePrograms } from '../src/config/monetization';
import { site } from '../src/config/site';
import { recordExit } from '../src/features/recommendations/exit';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { recommendationFixture } from './fixtures/recommendations';
import { createPublicRepository,validateCatalog } from '../src/lib/catalog';
import { recommendations,filterRecommendations } from '../src/features/recommendations/model';
import { Detail } from '../src/features/recommendations/Detail';
import { Catalog } from '../src/features/recommendations/Catalog';
const now = new Date('2026-10-21T12:00:00Z');
function setup() { const repo = createPublicRepository(recommendationFixture()); return {repo,item:recommendations(repo.products(),repo.reviews())[0]!}; }
function html(archived=false, monetized=false) {
  const data = recommendationFixture(); if (archived) data.products[0]!.status = 'archived';
  const repo = createPublicRepository(data); const item = recommendations(repo.recommendationProducts(),repo.reviews())[0]!;
  return renderToStaticMarkup(<Detail item={item} offers={repo.offersFor(item.product.id)} sources={repo.sources()} alternatives={[]} now={now} affiliatesEnabled={monetized} />);
}
describe('recomendações editoriais', () => {
  it('combina filtros e permite limpar sem perder registros', () => {
    const {item} = setup();
    expect(filterRecommendations([item],{use:'Estudar',category:'cpu',method:'documental'})).toHaveLength(1);
    expect(filterRecommendations([item],{use:'Estudar',category:'ram',method:'documental'})).toEqual([]);
    expect(filterRecommendations([item],{use:'',category:'',method:''})).toHaveLength(1);
    expect(renderToStaticMarkup(<Catalog items={[]} />)).toContain('Ainda não há recomendações revisadas');
  });
  it('renderiza método, fonte, dados desconhecidos e falta de imagem/alternativa', () => {
    const result = html();
    for (const text of ['Análise documental','Não informado','Imagem autorizada não disponível','Nenhuma alternativa verificada','Limitação sintética','Fixture sintética']) expect(result).toContain(text);
    expect(result).not.toContain('Uso e recomendo'); expect(result).not.toContain('?tag=fixture');
  });
  it('preserva URL de arquivado, exclui catálogo e compra, mantém artigo antigo', () => {
    const data = recommendationFixture(); data.products[0]!.status = 'archived';
    const repo = createPublicRepository(data);
    expect(repo.products()).toEqual([]); expect(repo.productBySlug('product-test')).not.toBeNull();
    expect(repo.articles()).toHaveLength(1); expect(repo.offersFor('product-test')).toEqual([]);
    expect(html(true)).toContain('Produto arquivado'); expect(html(true)).not.toContain('https://example.org/item');
  });
  it('bloqueia hands-on sem confirmação, avaliação incompleta e alternativas quebradas', () => {
    for (const patch of [{method:'hands-on',ownerApprovedAt:null},{summary:undefined},{uses:[]},{alternativeProductIds:['missing']}]) {
      const data = recommendationFixture(); Object.assign(data.reviews[0]!,patch); expect(() => validateCatalog(data)).toThrow();
    }
  });
  it.each(['javascript:alert(1)','data:text/html,x','file:///tmp/x','https://user:pass@example.org','//example.org'])('rejeita destino malicioso %s', destinationUrl => {
    const data = recommendationFixture(); data.offers[0]!.destinationUrl = destinationUrl; expect(() => validateCatalog(data)).toThrow();
  });
  it('não exige oferta e sinaliza link a revisar', () => {
    const {repo,item} = setup();
    expect(renderToStaticMarkup(<Detail item={item} offers={[]} sources={[]} alternatives={[]} now={now} />)).toContain('Nenhuma oferta verificada');
    const offers=repo.offersFor(item.product.id); offers[0]!.lastLinkCheck=null;
    const result=renderToStaticMarkup(<Detail item={item} offers={offers} sources={[]} alternatives={[]} now={now} />);
    expect(result).toContain('Link a revisar'); expect(result).not.toContain('https://example.org/item');
  });
  it('exibe comissão antes da oferta e preserva URL e sponsored só quando habilitado', () => {
    const previous=site.origin;
    Object.assign(site,{origin:'https://portal.test'});
    affiliatePrograms.push({id:'loja',merchant:'Loja sintética',enabled:true,approvedAt:'2026-10-01T00:00:00Z',termsReviewedAt:'2026-10-01T00:00:00Z',validUntil:'2026-12-01T00:00:00Z',channelOrigin:'https://portal.test',allowedHosts:['example.org'],disclosure:'Podemos receber comissão.'});
    let result:string;
    try {result=html(false,true);} finally {affiliatePrograms.pop();Object.assign(site,{origin:previous});}
    expect(result.indexOf('Podemos receber comissão')).toBeLessThan(result.indexOf('Consultar preço na loja'));
    expect(result).toContain('sponsored noopener noreferrer'); expect(result).toContain('https://example.org/item?tag=fixture');
  });
});

it('evento de saída omite URL e falha de observador não bloqueia', () => {
  let payload:unknown;
  const input = {productId:'product-test',merchant:'Loja sintética',placement:'recommendation-detail' as const,href:'https://example.org/?secret=tracking'};
  recordExit(input,event => {payload=event;});
  expect(payload).toEqual({productId:input.productId,merchant:input.merchant,placement:input.placement});
  expect(() => recordExit(input,() => {throw new Error('observador');})).not.toThrow();
});

it('ordena lojistas por ordem editorial e arquivar não dispensa aprovação', () => {
  const data = recommendationFixture();
  data.offers[0]!.editorialOrder=10;
  data.offers.push({...data.offers[0]!,id:'offer-first',editorialOrder:1});
  expect(createPublicRepository(data).offersFor('product-test').map(o=>o.id)).toEqual(['offer-first','offer-test']);
  data.products[0]!.status='archived'; data.products[0]!.ownerApprovedAt=null;
  expect(()=>validateCatalog(data)).toThrow(/aprovação/);
});
