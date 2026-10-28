import {z} from 'zod';
import {retailerUrl} from './hardware/retailers';

export const mercadoLink=z.string().max(4000).refine(value=>{try{return retailerUrl(value).retailer==='mercadolivre';}catch{return false;}},'Use um link HTTPS do Mercado Livre.');
export const mercadoImage=z.url().refine(value=>{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.port&&/(^|\.)mlstatic\.com$/.test(url.hostname);},'Imagem inválida.');
export const recommendationCardSchema=z.object({
 id:z.string().regex(/^MLB\d{5,20}$/),catalogId:z.string().regex(/^MLB\d{5,20}$/).nullable(),
 affiliateUrl:mercadoLink,name:z.string().min(1).max(500),category:z.string().min(1).max(120),
 image:mercadoImage.nullable(),facts:z.array(z.string().max(220)).max(4),
 state:z.enum(['active','unavailable']),checkedAt:z.iso.datetime(),
 price:z.object({amountCents:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),regularCents:z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),currency:z.literal('BRL'),itemId:z.string().regex(/^MLB\d{5,20}$/),observedAt:z.iso.datetime(),expiresAt:z.iso.datetime(),source:z.enum(['sale_price','catalog_items']),scope:z.enum(['linked_item','catalog_from'])}).nullable(),
});
export type RecommendationCard=z.infer<typeof recommendationCardSchema>;
export const recommendationFeedSchema=z.object({items:z.array(recommendationCardSchema).max(24)});
export function currentPrice(card:RecommendationCard,now:number){const price=card.price;return card.state==='active'&&price&&Date.parse(price.observedAt)<=now&&Date.parse(price.expiresAt)>now?price:null;}
export function discountPercent(card:RecommendationCard,now:number){const price=currentPrice(card,now);return price?.regularCents&&price.regularCents>price.amountCents?Math.floor((price.regularCents-price.amountCents)*100/price.regularCents):0;}
