import {z} from 'zod';
import {hardwareKind,hardwareImageSchema} from './contracts';
export const hardwareSummarySchema=z.object({id:z.string(),kind:hardwareKind,image:hardwareImageSchema.nullable().optional(),deviceType:z.enum(['phone','tablet']).optional(),name:z.string(),brand:z.string(),modelCode:z.string(),variant:z.string(),asset:z.string().regex(/^\/data\/hardware\/(?:icecat-(phone|cpu|ram)-[1-9]\d*-\w+\.json|pack-[a-f0-9]{20}\.json#icecat-(phone|cpu|ram)-[1-9]\d*)$/)});
export function hardwareAssetPayload(payload:unknown,asset:string):unknown{
 const key=asset.split('#')[1];
 if(!key)return payload;
 if(!payload||typeof payload!=='object'||!Object.hasOwn(payload,key))throw new Error('Ficha ausente no pacote.');
 return (payload as Record<string,unknown>)[key];
}
export const hardwareFeedSchema=z.object({updatedAt:z.string(),discovered:z.number(),unavailable:z.number(),items:z.array(hardwareSummarySchema)});
export type HardwareSummary=z.infer<typeof hardwareSummarySchema>;
export type HardwareFeed=z.infer<typeof hardwareFeedSchema>;
