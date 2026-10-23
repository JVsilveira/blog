export type AffiliateProgram = {
  id:string; merchant:string; enabled:boolean; approvedAt:string; termsReviewedAt:string;
  validUntil:string; channelOrigin:string; allowedHosts:string[]; disclosure:string;
};
// Apenas dados públicos confirmados. Conta, termos e canal ainda não aprovados.
export const affiliatePrograms:AffiliateProgram[] = [];
export function approvedProgram(merchant:string, href:string, origin:string|null, now:Date, programs:AffiliateProgram[]=affiliatePrograms) {
  if(!origin) return null;
  return programs.find(p=>p.enabled && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) && p.merchant===merchant && p.channelOrigin===origin && p.disclosure.trim() &&
    Date.parse(p.approvedAt)<=now.getTime() && Date.parse(p.termsReviewedAt)<=now.getTime() && Date.parse(p.validUntil)>now.getTime() && p.allowedHosts.includes(new URL(href).hostname))??null;
}
