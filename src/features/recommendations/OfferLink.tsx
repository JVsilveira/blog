'use client';
import { analytics } from '../../lib/analytics';
import { recordExit } from './exit';
export function OfferLink({href,rel,productId,merchant,monetized=false}: {href:string; rel:string; productId:string; merchant:string; monetized?:boolean}) {
  return <a href={href} rel={rel} onClick={() => {recordExit({productId,merchant,placement:'recommendation-detail'});if(monetized)analytics.track({name:'affiliate_click',productId,merchant,placement:'recommendation-detail'});}}>Consultar preço na loja</a>;
}
