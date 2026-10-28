import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {recommendationCardSchema,currentPrice,discountPercent} from '../src/domain/recommendation-feed';
import {OfferCard} from '../src/features/recommendations/OfferShowcase';
const now=Date.parse('2026-10-28T12:00:00Z');
const card=recommendationCardSchema.parse({id:'MLB123456',catalogId:'MLB123456',name:'Produto sintético de teste',category:'Teste',affiliateUrl:'https://www.mercadolivre.com.br/p/MLB123456?matt_tool=123',image:null,facts:[],state:'active',checkedAt:'2026-10-28T12:00:00Z',price:{amountCents:10000,regularCents:12500,currency:'BRL',itemId:'MLB123456789',observedAt:'2026-10-28T12:00:00Z',expiresAt:'2026-10-28T15:00:00Z',source:'catalog_items',scope:'catalog_from'}});
it('calcula desconto pela referência da mesma oferta e esconde preço expirado, futuro ou inativo',()=>{
 expect(discountPercent(card,now)).toBe(20);
 expect(currentPrice(card,now+4*3600000)).toBeNull();expect(currentPrice(card,now-1000)).toBeNull();expect(currentPrice({...card,state:'unavailable'},now)).toBeNull();
});
it('card usa link informado, rel de afiliado e preço a partir de; nunca afirma menor preço histórico',()=>{
 const html=renderToStaticMarkup(<OfferCard item={card} now={now}/>);expect(html).toContain('matt_tool=123');expect(html).toContain('sponsored noopener noreferrer');expect(html).toContain('A partir de');expect(html).not.toContain('menor preço histórico');
 const expired=renderToStaticMarkup(<OfferCard item={card} now={now+4*3600000}/>);expect(expired).not.toContain('offer-discount');expect(expired).toContain('Consulte o preço');
});
it('não aceita imagens fora do provedor, credenciais na URL ou preço inventado negativo',()=>{
 expect(recommendationCardSchema.safeParse({...card,image:'https://evil.example/foto.jpg'}).success).toBe(false);
 expect(recommendationCardSchema.safeParse({...card,affiliateUrl:'https://secret@www.mercadolivre.com.br/p/MLB123456'}).success).toBe(false);
 expect(recommendationCardSchema.safeParse({...card,price:{...card.price,amountCents:-1}}).success).toBe(false);
});
