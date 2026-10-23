import {z} from 'zod';
import {hardwareKind,hardwareImageSchema} from './contracts';
export const hardwareSummarySchema=z.object({id:z.string(),kind:hardwareKind,image:hardwareImageSchema.nullable().optional(),deviceType:z.enum(['phone','tablet']).optional(),name:z.string(),brand:z.string(),modelCode:z.string(),variant:z.string(),asset:z.string().regex(/^\/data\/hardware\/icecat-(phone|cpu|ram)-[1-9]\d*-\w+\.json$/)});
export const hardwareFeedSchema=z.object({updatedAt:z.string(),discovered:z.number(),unavailable:z.number(),items:z.array(hardwareSummarySchema)});
export type HardwareSummary=z.infer<typeof hardwareSummarySchema>;
export type HardwareFeed=z.infer<typeof hardwareFeedSchema>;
