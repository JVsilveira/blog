import {z} from 'zod';
import {retailerProduct,type StoreLink} from './retailers';
import type {Hardware} from './contracts';
export const phoneRankingSchema=z.object({updatedAt:z.iso.datetime().nullable(),expiresAt:z.iso.datetime().nullable(),category:z.literal('MLB1055'),items:z.array(z.object({id:z.string().regex(/^MLB\d+$/),type:z.enum(['ITEM','PRODUCT']),position:z.number().int().min(1).max(20)})).max(20)});
export type PhoneRanking=z.infer<typeof phoneRankingSchema>;
export const emptyPhoneRanking:PhoneRanking={updatedAt:null,expiresAt:null,category:'MLB1055',items:[]};
export type AffiliatePhone=Pick<Hardware,'id'|'kind'|'deviceType'|'name'|'modelCode'|'image'>;
export function affiliatePhones<T extends AffiliatePhone>(items:T[],links:StoreLink[],ranking:PhoneRanking|null,now=Date.now()){
 const fresh=ranking&&ranking.updatedAt&&ranking.expiresAt&&Date.parse(ranking.updatedAt)<=now&&Date.parse(ranking.expiresAt)>now;
 return items.flatMap(item=>{
  if(item.kind!=='phone'||item.deviceType!=='phone')return [];
  const link=links.find(link=>link.hardwareId===item.id&&link.retailer==='mercadolivre');if(!link)return [];
  const product=link.productId&&link.catalog!==undefined?{id:link.productId,catalog:link.catalog}:retailerProduct(link.href);const rank=fresh?ranking.items.find(row=>row.id===product.id&&row.type===(product.catalog?'PRODUCT':'ITEM')):undefined;
  return [{item,link,position:rank?.position??null}];
 }).sort((a,b)=>(a.position??Infinity)-(b.position??Infinity)||a.item.name.localeCompare(b.item.name));
}
