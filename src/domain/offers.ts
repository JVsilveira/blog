import { approvedProgram, type AffiliateProgram } from '../config/monetization';
import { site } from '../config/site';
import { offerSchema, type AffiliateOffer } from './schemas';
export function presentOffer(input: AffiliateOffer, now: Date, affiliatesEnabled = false, programs?:AffiliateProgram[], origin:string|null = site.origin) {
  const offer = offerSchema.parse(input);
  if (offer.status !== 'published' || !offer.enabled || !offer.verifiedAt || Date.parse(offer.verifiedAt) > now.getTime()) return null;
  const observed = offer.observedAt ? Date.parse(offer.observedAt) : NaN;
  const canShowPrice = offer.pricePolicy === 'authorized-feed' && offer.authorization && observed <= now.getTime() && now.getTime() - observed <= offer.authorization.maxAgeHours * 3600000 && Date.parse(offer.authorization.validUntil) > now.getTime() && !!offer.expiresAt && Date.parse(offer.expiresAt) > now.getTime();
  const program = offer.affiliateUrl ? approvedProgram(offer.merchant,offer.affiliateUrl,origin,now,programs) : null;
  const monetized = affiliatesEnabled && !!offer.affiliateUrl && !!program;
  return { metricMerchant: program?.id ?? null, disclosure: monetized ? program!.disclosure : null, label: 'Consultar preço na loja', href: monetized ? offer.affiliateUrl! : offer.destinationUrl, monetized, rel: monetized ? 'sponsored noopener noreferrer' : 'noopener noreferrer', priceCents: canShowPrice ? offer.priceCents ?? null : null };
}
export const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
export const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(value));
