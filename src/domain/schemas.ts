import { z } from 'zod';

export const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const text = z.string().trim().min(1);
export const timestamp = z.iso.datetime({ offset: true });
export const httpsUrl = z.url().refine(value => new URL(value).protocol === 'https:' && !new URL(value).username && !new URL(value).password, 'Use URL HTTPS');
export const status = z.enum(['draft', 'published', 'archived']);
export const cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const base = { id, schemaVersion: z.literal(1), status, createdAt: timestamp, updatedAt: timestamp };
export const sourceSchema = z.strictObject({ ...base, url: httpsUrl, publisher: text, accessedAt: timestamp, scope: z.array(text).min(1), note: text.optional() });
export const authorSchema = z.strictObject({ ...base, name: text, ownerApprovedAt: timestamp.nullable() });
const unknownText = text.nullable();
const positive = z.number().positive().nullable();
// Somente categorias com contrato mínimo necessário; novas categorias exigem schema explícito.
export const specs = z.discriminatedUnion('category', [
  z.strictObject({ category: z.literal('phone') }),
  z.strictObject({ category: z.literal('mouse'), connectivity: unknownText, handedness: unknownText }),
  z.strictObject({ category: z.literal('keyboard'), connectivity: unknownText, layout: unknownText }),
  z.strictObject({ category: z.literal('headset'), connectivity: unknownText, microphone: z.boolean().nullable() }),
  z.strictObject({ category: z.literal('webcam'), connectivity: unknownText, maxResolution: unknownText }),
  z.strictObject({ category: z.literal('hub'), hostConnector: unknownText, ports: z.array(text).nullable(), powerDeliveryW: positive }),
  z.strictObject({ category: z.literal('router'), wifiStandard: unknownText, ethernetPorts: z.number().int().nonnegative().nullable() }),
  z.strictObject({ category: z.literal('monitor'), diagonalInches: positive, resolution: unknownText, inputs: z.array(text).nullable() }),
  z.strictObject({ category: z.literal('motherboard'), socket: unknownText, chipset: unknownText, formFactor: unknownText, memoryType: unknownText, memoryFormFactor: unknownText, maxMemoryGB: positive, slotsMemory: positive, storageInterfaces: z.array(text).nullable(), storageSlots: z.array(z.strictObject({ id: text, interface: text, formFactors: z.array(text), available: z.boolean().nullable() })).nullable(), pcieSlots: positive, powerConnectors: z.record(text,z.number().int().nonnegative()).nullable(), videoOutputs: z.array(text).nullable(), cpuSupport: z.array(z.strictObject({ cpuId: id, minimumBios: text, sourceIds: z.array(id).min(1) })).nullable(), installedBios: unknownText, biosVerifiedCpuIds: z.array(id).nullable(), lanesVerified: z.boolean().nullable() }),
  z.strictObject({ category: z.literal('gpu'), lengthMm: positive, thicknessSlots: positive, powerEstimateW: positive, requiredPowerConnectors: z.record(text,z.number().int().nonnegative()).nullable(), videoOutputs: z.array(text).nullable() }),
  z.strictObject({ category: z.literal('case'), supportedBoardFormats: z.array(text).nullable(), gpuClearanceMm: positive, gpuClearanceSlots: positive, coolerClearanceMm: positive, psuFormats: z.array(text).nullable(), radiatorRestrictions: unknownText, geometryVerified: z.boolean().nullable() }),
  z.strictObject({ category: z.literal('cooler'), supportedSockets: z.array(text).nullable(), heightMm: positive, mountingKitRequirement: unknownText, mountingKitVerified: z.boolean().nullable(), powerEstimateW: positive }),
  z.strictObject({ category: z.literal('psu'), continuousPowerW: positive, formFactor: unknownText, connectors: z.record(text,z.number().int().nonnegative()).nullable(), specificationSourceIds: z.array(id) }),
  z.strictObject({ category: z.literal('cpu'), socket: unknownText, powerEstimateW: positive, integratedGraphics: z.boolean().nullable(), memoryTypes: z.array(text).nullable(), coolerIncluded: z.boolean().nullable() }),
  z.strictObject({ category: z.literal('ram'), type: unknownText, kitCount: z.number().int().positive().nullable(), moduleCapacityGB: positive, formFactor: unknownText, speedMTs: positive, profileSupport: z.array(z.enum(['JEDEC','XMP','EXPO'])).nullable() }),
  z.strictObject({ category: z.literal('storage'), interface: unknownText, formFactor: unknownText, capacityGB: positive, slotRequirements: z.array(text).nullable() }),
]);
export const productSchema = z.strictObject({ ...base, slug: id, name: text, brand: text, category: z.enum(['phone','cpu','motherboard','gpu','case','cooler','psu','ram','storage','mouse','keyboard','headset','webcam','hub','router','monitor']), specs, sourceIds: z.array(id), images: z.array(z.strictObject({ src: z.string().regex(/^\/images\/[a-zA-Z0-9/_-]+\.(webp|png|jpg|avif)$/), alt: text, rightsSource: httpsUrl, width: z.number().int().positive(), height: z.number().int().positive() })), verificationStatus: z.enum(['pending','approved','rejected']), verifiedAt: timestamp.nullable(), editorialStatus: status, ownerApprovedAt: timestamp.nullable() }).refine(p => p.category === p.specs.category, 'Categoria e specs devem corresponder');
export const offerSchema = z.strictObject({ ...base, productId: id, merchant: text, destinationUrl: httpsUrl, affiliateUrl: httpsUrl.optional(), enabled: z.boolean(), verifiedAt: timestamp.nullable(), pricePolicy: z.enum(['none','authorized-feed']), priceCents: cents.optional(), currency: z.literal('BRL'), observedAt: timestamp.optional(), expiresAt: timestamp.optional(), sourceId: id,
  // Evidência explícita da autorização; somente declarar a política não autoriza preço.
  editorialOrder: z.number().int().nonnegative().default(0), lastLinkCheck: timestamp.nullable().default(null),
  authorization: z.strictObject({ sourceId: id, validUntil: timestamp, maxAgeHours: z.number().int().positive().max(168) }).optional(),
}).superRefine((o, ctx) => {
  const priceFields = o.priceCents !== undefined || o.observedAt !== undefined || o.expiresAt !== undefined;
  if (o.pricePolicy === 'none' && (priceFields || o.authorization)) ctx.addIssue({ code: 'custom', message: 'Política none não admite preço ou autorização' });
  if (o.pricePolicy === 'authorized-feed' && (o.priceCents === undefined || !o.observedAt || !o.expiresAt || !o.authorization)) ctx.addIssue({ code: 'custom', message: 'Feed exige preço, observação, validade e autorização' });
  if (o.observedAt && o.expiresAt && Date.parse(o.expiresAt) <= Date.parse(o.observedAt)) ctx.addIssue({ code: 'custom', message: 'Validade deve ser posterior à observação' });
});
export const reviewSchema = z.strictObject({ ...base, productId: id, method: z.enum(['hands-on','documental','editorial']), ownerApprovedAt: timestamp.nullable(), pros: z.array(text), cons: z.array(text), bestFor: z.array(text), avoidIf: z.array(text), summary: text.optional(), uses: z.array(text).default([]), alternativeProductIds: z.array(id).default([]) }).refine(r => r.status !== 'published' || r.method !== 'hands-on' || r.ownerApprovedAt !== null, 'Hands-on publicado exige confirmação do proprietário');
export const translationSchema = z.strictObject({
  language:z.enum(['en','es']), status:z.enum(['draft','published']),
  title:z.string().max(300), description:z.string().max(1000), body:z.string().max(200000),
  methodology:z.string().max(5000), limitations:z.string().max(5000),
  sourceUpdatedAt:timestamp.nullable(), reviewedAt:timestamp.nullable(),
}).superRefine((value,ctx) => {
  if(value.status==='published' && (!value.reviewedAt || !value.sourceUpdatedAt || [value.title,value.description,value.body,value.methodology,value.limitations].some(text=>!text.trim())))
    ctx.addIssue({code:'custom',message:'Tradução publicada exige texto completo e revisão humana.'});
});
export const articleSchema = z.strictObject({ ...base, featuredOrder:z.number().int().min(1).max(99999).nullable().optional(), kind:z.enum(['blog','news','opinion']).optional(), translations:z.array(translationSchema).max(2).optional(), slug: id, title: text, description: text, authorId: id, category: text, tags: z.array(text), publishedAt: timestamp.nullable(), sourceIds: z.array(id), relatedProductIds: z.array(id), methodology: text, limitations: text, ownerApprovedAt: timestamp.nullable(), body: text }).refine(a => a.status !== 'published' || (a.ownerApprovedAt !== null && a.publishedAt !== null && a.sourceIds.length > 0), 'Artigo publicado exige aprovação, data e fontes');
export const catalogSchema = z.strictObject({ schemaVersion: z.literal(1), sources: z.array(sourceSchema), authors: z.array(authorSchema), products: z.array(productSchema), offers: z.array(offerSchema), reviews: z.array(reviewSchema), articles: z.array(articleSchema) });
export type Catalog = z.infer<typeof catalogSchema>;
export type Product = z.infer<typeof productSchema>;
export type Article = z.infer<typeof articleSchema>;
export type AffiliateOffer = z.infer<typeof offerSchema>;
export type SourceReference = z.infer<typeof sourceSchema>;
export type ReviewClaim = z.infer<typeof reviewSchema>;
