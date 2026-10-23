import { analytics } from '../../lib/analytics';
// Fronteira mínima da etapa 06: sem SDK, rede, armazenamento ou texto de busca.
export type PhoneEvent = { action:'selection'|'comparison'|'offer'; variantIds:string[] };
export function recordPhoneEvent(event:PhoneEvent,adapter:(event:PhoneEvent)=>void=()=>{}):void {
  if(event.action==='comparison') analytics.track({name:'phone_compare',modelIds:event.variantIds.slice(0,3)});
  try {adapter({action:event.action,variantIds:event.variantIds.slice(0,3)});} catch { /* observador não impede a interação */ }
}
