import {z} from 'zod';
import {id,translationSchema} from '../../src/domain/schemas';
const articleInput = z.strictObject({
  action: z.literal("article"),
  revision: z.string(),
  slug: id.refine((v) => v !== "sem-publicacao"),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(1000),
  authorId: id,
  category: z.string().trim().min(1).max(100),
  featuredOrder:z.number().int().min(1).max(99999).nullable().optional(),
  kind:z.enum(['blog','news','opinion']).default('blog'),
  translations:z.array(translationSchema.safeExtend({approved:z.boolean().optional()})).max(2).optional(),
  tags: z.array(z.string().trim().max(80)).max(30).transform(tags => tags.filter(Boolean)),
  sourceIds: z.array(id).max(100),
  relatedProductIds: z.array(id).max(100),
  methodology: z.string().trim().min(1).max(5000),
  limitations: z.string().trim().min(1).max(5000),
  body: z.string().trim().min(1).max(200_000),
  status: z.enum(["draft", "published", "archived"]),
  approved: z.boolean(),
  creating: z.boolean(),
});
export const mutationSchema = z.discriminatedUnion("action", [
  articleInput,
  z.strictObject({
    action: z.literal("author"),
    revision: z.string(),
    id,
    name: z.string().trim().min(1).max(200),
    approved: z.boolean(),
    creating: z.boolean(),
  }),
  z.strictObject({
    action: z.literal("source"),
    revision: z.string(),
    id,
    url: z.string().max(2000),
    publisher: z.string().trim().min(1).max(300),
    accessedAt: z.string(),
    scope: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
    note: z.string().max(5000),
    approved: z.boolean(),
    creating: z.boolean(),
  }),
]);

