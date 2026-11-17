import {it,expect} from 'vitest';
import {recommendationFeedSchema} from '../src/domain/recommendation-feed';
it('aceita snapshot de produção acima do limite histórico de 24 e mantém teto de 96',()=>{
 const item={id:'MLB123456',catalogId:'MLB123456',name:'Fixture de contrato',category:'Teste',affiliateUrl:'https://www.mercadolivre.com.br/p/MLB123456',image:null,facts:[],state:'active',checkedAt:'2026-10-28T12:00:00Z',price:null};
 expect(recommendationFeedSchema.parse({items:Array.from({length:51},(_,i)=>({...item,id:'MLB'+(123456+i)}))}).items).toHaveLength(51);
 expect(recommendationFeedSchema.safeParse({items:Array.from({length:97},()=>item)}).success).toBe(false);
});
