import {z} from 'zod';
export type Retailer='amazon'|'mercadolivre';
export function retailerUrl(raw:string){
 const url=new URL(raw.trim());if(url.protocol!=='https:'||url.username||url.password||url.port||url.href.length>4000)throw new Error('Use um link HTTPS de produto da Amazon Brasil ou do Mercado Livre.');
 const host=url.hostname.toLowerCase();const retailer:Retailer|undefined=/^(www\.)?amazon\.com\.br$/.test(host)||['amzn.to','a.co'].includes(host)?'amazon':/(^|\.)mercadolivre\.com\.br$/.test(host)||host==='meli.la'?'mercadolivre':undefined;if(!retailer)throw new Error('Loja não suportada. Use Amazon Brasil ou Mercado Livre.');return {url,retailer};
}
export function retailerProduct(raw:string){const {url,retailer}=retailerUrl(raw);if(retailer==='amazon'){const id=/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i.exec(url.pathname)?.[1];return {retailer,url,id:id?.toUpperCase(),catalog:false};}const id=/\bMLB-?(\d{5,20})\b/i.exec(url.pathname)?.[1];return {retailer,url,id:id?'MLB'+id:undefined,catalog:/\/p\/MLB/i.test(url.pathname)};}
export const storeLinkSchema=z.object({hardwareId:z.string(),retailer:z.enum(['amazon','mercadolivre']),href:z.string().refine(value=>{try{retailerUrl(value);return true;}catch{return false;}},'Link de loja inválido'),productId:z.string().regex(/^(MLB[1-9]\d{4,19}|[A-Z0-9]{10})$/).optional(),catalog:z.boolean().optional(),addedAt:z.string()});
export const storeLinksSchema=z.array(storeLinkSchema);
export type StoreLink=z.infer<typeof storeLinkSchema>;
