import { z } from 'zod';
import { id, text, timestamp, status } from '../schemas';
export const slots = ['cpu','motherboard','ram','gpu','storage','psu','case','cooler'] as const;
export type Slot = typeof slots[number];
export const selectionSchema = z.strictObject({ schemaVersion:z.literal(1), components:z.strictObject({cpu:id.nullable(),motherboard:id.nullable(),ram:id.nullable(),gpu:id.nullable(),storage:id.nullable(),psu:id.nullable(),case:id.nullable(),cooler:id.nullable()}) });
export type Selection = z.infer<typeof selectionSchema>;
export const configurationSchema = z.strictObject({id, schemaVersion:z.literal(1),slug:id,status,createdAt:timestamp,updatedAt:timestamp,title:text,use:z.enum(['study','development','gaming']),summary:text,limitations:z.array(text).min(1),method:z.literal('editorial'),ownerApprovedAt:timestamp.nullable(),sourceIds:z.array(id),selection:selectionSchema,reasons:z.record(id,text),alternatives:z.array(z.strictObject({slot:z.enum(slots),productId:id,reason:text})).max(8)});
export const configurationsSchema = z.strictObject({schemaVersion:z.literal(1),configurations:z.array(configurationSchema)});
export type Configuration = z.infer<typeof configurationSchema>;
