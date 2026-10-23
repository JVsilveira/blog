// Suporte mínimo da etapa 04. Sem SDK, rede, armazenamento ou URL de tracking.
export type ExitEvent = {productId:string; merchant:string; placement:'recommendation-detail'};
const noop = (_event:ExitEvent) => { void _event; };
export function recordExit(event:ExitEvent, adapter:(event:ExitEvent) => void = noop):void {
  // Um observador nunca interfere no comportamento nativo do link.
  try { adapter({productId:event.productId,merchant:event.merchant,placement:event.placement}); } catch { /* navegação continua */ }
}
