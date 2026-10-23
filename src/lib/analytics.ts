import { z } from 'zod';
import { site } from '../config/site';
const key = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const event = <T extends string, S extends z.ZodRawShape>(name:T, shape:S) => z.strictObject({name:z.literal(name), ...shape});
export const analyticsEventSchema = z.discriminatedUnion('name', [
  event('article_view',{articleId:key}), event('recommendation_view',{productId:key}),
  event('affiliate_click',{productId:key,merchant:key,placement:z.enum(['recommendation-detail','phone-detail'])}),
  event('pc_builder_slot',{slot:z.enum(['cpu','motherboard','ram','gpu','storage','psu','case','cooler'])}),event('pc_builder_start',{}),event('pc_builder_complete',{status:z.enum(['pass','fail','unknown'])}),
  event('phone_compare',{modelIds:z.array(key).min(2).max(3).refine(ids=>new Set(ids).size===ids.length)}),
  event('quote_export',{format:z.enum(['json','pdf'])}),event('search_result_open',{contentId:key}),
]);
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export interface AnalyticsAdapter { track(event:AnalyticsEvent):void }
export const noopAnalytics:AnalyticsAdapter = {track:()=>{}};
export function createAnalytics(options:{enabled?:boolean;debug?:boolean;environment?:string;sink?:(event:AnalyticsEvent)=>void}={}) {
  const adapter:AnalyticsAdapter = options.enabled && options.debug && options.environment==='development'
    ? {track:e=>(options.sink??console.debug)(e)} : noopAnalytics;
  return {track(input:unknown):boolean {
    const parsed=analyticsEventSchema.safeParse(input);
    if(!parsed.success) return false;
    try {adapter.track(parsed.data);return true;} catch {return false;}
  }};
}
// Nenhum provedor remoto existe nesta etapa. Debug requer opção explícita em desenvolvimento.
export const analytics = createAnalytics({enabled:site.features.analytics,environment:process.env.NODE_ENV});
