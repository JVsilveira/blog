import type { Phone, Field } from '../../domain/phones/contracts';
import { labels } from '../../domain/phones/contracts';
import { display } from '../../domain/phones/compare';
import type { SourceReference } from '../../domain/schemas';
import type { Hardware } from '../../domain/hardware/contracts';
// Existing approved variants keep all fields and their original provenance.
export function phoneHardware(phone:Phone,name:string,sources:SourceReference[],today:string):Hardware {
 const sourceFor=(field:Field)=>sources.find(s=>(phone.sourceIds[field]??[]).includes(s.id));
 const fallback=sources.find(s=>phone.editorial?.sourceIds.includes(s.id))!;
 const provenance=(source:SourceReference)=>({publisher:source.publisher,url:source.url,accessedAt:source.accessedAt,license:'Referência documental; direitos do titular',licenseUrl:source.url});
 return {schemaVersion:1,publication:'editorial',id:phone.id,kind:'phone',deviceType:'phone',name,brand:name,modelCode:phone.manufacturerModelCode??'Código não confirmado',variant:`${phone.ramGB??'Não confirmado'} GB RAM / ${phone.storageGB??'Não confirmado'} GB · ${phone.region??'Região não confirmada'}`,status:'published',createdAt:phone.createdAt,updatedAt:phone.updatedAt,reviewedAt:phone.ownerApprovedAt,reviewer:'Revisão editorial do catálogo de celulares',demonstration:false,
 source:provenance(fallback),specifications:(Object.keys(labels) as Field[]).map(field=>({key:`phone-${field.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}`,group:'Ficha da variante',label:labels[field],value:phone[field]===null?null:display(phone,field,today),unit:'',source:provenance(sourceFor(field)??fallback)})),benchmarks:[],limitations:phone.editorial?.limitations??['Análise documental; benchmarks comparáveis não cadastrados.']};
}
