import { z } from 'zod';
import { id, timestamp, httpsUrl } from '../schemas';
const plain=z.string().trim().min(1).max(2000).refine(s=>!/[<>]/.test(s),'Use somente texto, sem HTML');
export const hardwareKind=z.enum(['phone','cpu','ram']);
export type HardwareKind=z.infer<typeof hardwareKind>;
export const provenanceSchema=z.strictObject({publisher:plain,url:httpsUrl,accessedAt:timestamp,license:plain,licenseUrl:httpsUrl});
export const specificationSchema=z.strictObject({key:id,group:plain,label:plain,value:z.union([plain,z.number().finite(),z.boolean()]).nullable(),displayValue:plain.nullable().optional(),unit:z.string().max(100),source:provenanceSchema});
export const benchmarkSchema=z.strictObject({
 id, suite:plain,version:plain,workload:plain,unit:plain,direction:z.enum(['higher','lower']),score:z.number().finite().positive(),
 // Same protocol, platform and conditions are required; no inferred compatibility.
 protocol:plain,platform:plain,settings:plain,measuredAt:timestamp,source:provenanceSchema,
});
export const hardwareImageSchema=z.object({src:z.string().regex(/^\/images\/hardware\/[a-f0-9]{64}\.(jpg|png|webp)$/),alt:plain,width:z.number().int().positive(),height:z.number().int().positive()});
export const hardwareSchema=z.strictObject({
 schemaVersion:z.literal(1),deviceType:z.enum(['phone','tablet']).optional(),syncVersion:z.number().int().optional(),image:hardwareImageSchema.nullable().optional(),publication:z.enum(['editorial','provider']).default('editorial'),lastSyncedAt:timestamp.optional(),id,kind:hardwareKind,name:plain,brand:plain,modelCode:plain,variant:plain,
 status:z.enum(['draft','published','archived']),createdAt:timestamp,updatedAt:timestamp,reviewedAt:timestamp.nullable(),reviewer:plain.nullable(),
 source:provenanceSchema,demonstration:z.boolean().default(false),
 specifications:z.array(specificationSchema).min(1).max(2000),benchmarks:z.array(benchmarkSchema).max(100),limitations:z.array(plain).min(1),
}).superRefine((item,ctx)=>{
 if(item.deviceType&&item.kind!=='phone')ctx.addIssue({code:'custom',message:'Categoria de aparelho incompatível'});
 if(Date.parse(item.updatedAt)<Date.parse(item.createdAt))ctx.addIssue({code:'custom',message:'Cronologia inválida'});
 for(const date of [item.source.accessedAt,...item.specifications.map(s=>s.source.accessedAt),...item.benchmarks.flatMap(b=>[b.measuredAt,b.source.accessedAt])])if(Date.parse(date)>Date.parse(item.updatedAt))ctx.addIssue({code:'custom',message:'Fonte ou teste posterior à revisão do registro'});
 if(item.reviewedAt && Date.parse(item.reviewedAt)>Date.parse(item.updatedAt))ctx.addIssue({code:'custom',message:'Revisão posterior ao registro'});
 if(item.status==='published' && [item.source,...item.specifications.map(s=>s.source),...item.benchmarks.map(b=>b.source)].some(s=>/PREENCHER|SUBSTITUIR/i.test(s.license)))ctx.addIssue({code:'custom',message:'Confirme a licença de republicação antes de publicar'});
 if(item.status==='published' && item.publication==='editorial' && item.reviewedAt && Date.parse(item.reviewedAt)!==Date.parse(item.updatedAt))ctx.addIssue({code:'custom',message:'Alterações na ficha exigem nova revisão'});
 if(item.status==='published' && (item.demonstration || /PREENCHER|SUBSTITUIR/i.test(item.variant) || (item.publication==='editorial'&&(!item.reviewedAt || !item.reviewer))))ctx.addIssue({code:'custom',message:'Publicação exige revisão real e proíbe demonstrações'});
 if(item.publication==='provider'&&(!/^icecat-(phone|cpu|ram)-[1-9]\d*$/.test(item.id)||item.source.license!=='Open Icecat Open Content License'||item.reviewer!==null||item.reviewedAt!==null))ctx.addIssue({code:'custom',message:'Ficha automática exige origem Open Icecat e não representa revisão humana'});
 for(const [label,list] of [['especificação',item.specifications],['benchmark',item.benchmarks]] as const){const keys=list.map(v=>'key' in v?v.key:v.id);if(new Set(keys).size!==keys.length)ctx.addIssue({code:'custom',message:`${label} duplicado`});}
});
export const hardwareCatalogSchema=z.strictObject({schemaVersion:z.literal(1),items:z.array(hardwareSchema)}).superRefine((data,ctx)=>{
 if(new Set(data.items.map(i=>i.id)).size!==data.items.length)ctx.addIssue({code:'custom',message:'Produto duplicado'});
});
export type Hardware=z.infer<typeof hardwareSchema>;
export type Benchmark=z.infer<typeof benchmarkSchema>;
export type Specification=z.infer<typeof specificationSchema>;
