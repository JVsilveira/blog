'use client';
import { analytics } from '../../lib/analytics';
export function PhoneOfferLink({href,rel,productId,merchant,monetized=false}:{href:string;rel:string;productId:string;merchant:string;monetized?:boolean}) {
  return <a href={href} rel={rel} onClick={()=>monetized && analytics.track({name:'affiliate_click',productId,merchant,placement:'phone-detail'})}>Consultar preço na loja</a>;
}
