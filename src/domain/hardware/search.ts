import type {Hardware} from './contracts';
export type SearchableHardware=Pick<Hardware,'id'|'name'|'brand'|'modelCode'|'variant'>;
export const normalizeModelSearch=(text:string)=>text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\+/g,' plus ').replace(/[^a-z0-9]+/g,' ').trim();
export function createHardwareSearch<T extends SearchableHardware>(items:T[]){
 const indexed=items.map(item=>{const name=normalizeModelSearch(`${item.brand} ${item.name}`),code=normalizeModelSearch(item.modelCode),variant=normalizeModelSearch(item.variant);return {item,name,code,text:`${name} ${code} ${variant}`.replace(/\b([a-z])\s+(\d)/g,'$1$2'),compact:`${name} ${code} ${variant}`.replace(/\s/g,'')};});
 return (query:string)=>{const normalized=normalizeModelSearch(query).replace(/\b([a-z])\s+(\d)/g,'$1$2'),terms=normalized.split(/\s+/).filter(Boolean);if(!terms.length)return items;
  return indexed.flatMap(row=>{if(!terms.every(term=>row.text.includes(term)||row.compact.includes(term)))return [];let score=0;for(const term of terms){if(row.name.includes(term))score+=10;if(row.code.replace(/\s/g,'').includes(term))score+=6;}if(row.name.startsWith(normalized))score+=20;return [{item:row.item,score}];}).sort((a,b)=>b.score-a.score||a.item.name.localeCompare(b.item.name,'pt-BR')||a.item.modelCode.localeCompare(b.item.modelCode)).map(row=>row.item);
 };
}
