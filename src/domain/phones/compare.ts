import { formatDate } from '../offers';
import type { Phone, Field } from './contracts';
import { labels } from './contracts';
export const unknown = 'Não confirmado';
const number = (n:number) => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
const value = (v:string|number|boolean|null):string => v === null ? unknown : typeof v === 'boolean' ? v ? 'Sim' : 'Não' : typeof v === 'number' ? number(v) : v;
export function display(p:Phone, field:Field, today:string):string {
  const v=p[field];
  if(v === null) return unknown;
  switch(field) {
    case 'screen': { const s=p.screen!; return `${value(s.technology)} · ${value(s.sizeInches)} pol. · ${value(s.resolution)} · ${value(s.refreshHz)} Hz`; }
    case 'dimensions': { const d=p.dimensions!; return `${value(d.heightMm)} × ${value(d.widthMm)} × ${value(d.depthMm)} mm (altura × largura × espessura)`; }
    case 'cameras': return p.cameras!.length ? p.cameras!.map(c=>`${c.lens}: ${value(c.megapixels)} MP; OIS: ${value(c.ois)}`).join('; ') : unknown;
    case 'connectivity': { const c=p.connectivity!; return `NFC: ${value(c.nfc)}; eSIM: ${value(c.esim)}; bandas: ${c.networkBands?.join(', ') || unknown}`; }
    case 'updatePolicy': { const u=p.updatePolicy!; return `${value(u.announcedYears)} anos anunciados; fim da segurança: ${u.securityEndDate ? u.securityEndDate.split('-').reverse().join('/') : unknown}${u.securityEndDate && u.securityEndDate < today ? ' — prazo anunciado encerrado; revalidar com o fabricante' : ''}; política conferida em ${formatDate(u.verifiedAt)}`; }
    default: return value(v as string|number|boolean);
  }
}
export function title(p:Phone,name:string) {
  return `${name} — ${value(p.ramGB)} GB RAM / ${value(p.storageGB)} GB · ${value(p.region)} · ${value(p.manufacturerModelCode)}`;
}
export function resolveIds(raw:string,variants:Phone[]) {
  const ids:string[]=[], messages:string[]=[];
  for(const token of raw.split(',').filter(Boolean)) {
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(token)||!variants.some(p=>p.id===token)) {messages.push('Um ID inválido ou indisponível foi ignorado.');continue;}
    if(ids.includes(token)) {messages.push('Uma variante duplicada foi removida.');continue;}
    if(ids.length===3) {messages.push('O limite é de três variantes.');continue;}
    ids.push(token);
  }
  return {ids,messages:[...new Set(messages)]};
}
function hasUnknown(v:unknown):boolean {return v===null || (Array.isArray(v) ? !v.length || v.some(hasUnknown) : typeof v==='object' && Object.values(v as object).some(hasUnknown));}
export function comparisonRows(phones:Phone[],onlyDifferences:boolean) {
  return (Object.keys(labels) as Field[]).filter(f=>!onlyDifferences || phones.some(p=>hasUnknown(p[f])) || new Set(phones.map(p=>JSON.stringify(p[f]))).size>1);
}
export function measurableDifferences(phones:Phone[],names:Record<string,string>) {
  const out:string[]=[];
  for(const [field,label,unit] of [['weightG','Menor peso','g'],['storageGB','Maior armazenamento','GB']] as const) {
    if(phones.length<2||phones.some(p=>p[field]===null)) continue;
    const values=phones.map(p=>p[field]!); const best=field==='weightG'?Math.min(...values):Math.max(...values);
    if(new Set(values).size<2) continue;
    out.push(`${label}: ${phones.filter(p=>p[field]===best).map(p=>title(p,names[p.productId] ?? p.productId)).join('; ')} (${number(best)} ${unit}).`);
  }
  return out;
}
