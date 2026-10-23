import type { Hardware, Benchmark, Specification } from './contracts';
export const benchmarkKey=(b:Benchmark)=>JSON.stringify([b.suite,b.version,b.workload,b.unit,b.direction,b.protocol,b.platform,b.settings]);
export function benchmarkChoices(items:Hardware[]) {
 return [...new Map(items.flatMap(item=>item.benchmarks.map(b=>[benchmarkKey(b),b] as const))).entries()].map(([key,benchmark])=>({key,benchmark}));
}
export function specificationRows(items:Hardware[],onlyDifferences=false) {
 const rows=[...new Map(items.flatMap(item=>item.specifications.map(s=>[`${s.key}:${s.unit}`,s] as const))).entries()];
 return rows.filter(([key])=>!onlyDifferences||items.some(item=>!item.specifications.some(s=>`${s.key}:${s.unit}`===key&&s.value!==null)) || new Set(items.map(item=>JSON.stringify(item.specifications.find(s=>`${s.key}:${s.unit}`===key)?.value))).size>1);
}
export function resolveHardwareIds(raw:string,items:Pick<Hardware,'id'>[]) {
 const ids:string[]=[],messages:string[]=[];
 for(const id of raw.split(',').filter(Boolean)){
  if(!items.some(item=>item.id===id)){messages.push('Um modelo inválido ou indisponível foi ignorado.');continue;}
  if(ids.includes(id)){messages.push('Um modelo duplicado foi removido.');continue;}
  if(ids.length===3){messages.push('Compare até três modelos.');continue;}
  ids.push(id);
 }
 return {ids,messages:[...new Set(messages)]};
}
export function inputPriceCents(raw:string):number|null {
 if(!/^\d{1,9}([.,]\d{1,2})?$/.test(raw.trim()))return null;
 const cents=Math.round(Number(raw.trim().replace(',','.'))*100);
 return Number.isSafeInteger(cents)&&cents>0?cents:null;
}
export type ValueResult={ready:false;reason:string}|{ready:true;rows:{id:string;score:number;totalCents:number;value:number}[];winnerIds:string[];performanceIds:string[]};
export function analyzeValue(items:Hardware[],key:string,prices:Record<string,number|null>,extras:Record<string,number|null>={}):ValueResult {
 if(items.length<2)return {ready:false,reason:'Selecione pelo menos dois modelos.'};
 if(new Set(items.map(i=>i.kind)).size!==1)return {ready:false,reason:'Compare produtos da mesma categoria.'};
 if(!key)return {ready:false,reason:'Ainda não há um benchmark comparável selecionado. Não é possível concluir desempenho só pelas especificações.'};
 const matches=items.map(i=>i.benchmarks.filter(b=>benchmarkKey(b)===key));
 if(matches.some(list=>list.length!==1))return {ready:false,reason:'Falta o mesmo teste, versão, protocolo, plataforma ou configuração para todos os modelos. Não há vencedor de desempenho confirmado.'};
 if(items.some(i=>!Number.isSafeInteger(prices[i.id]) || (prices[i.id]??0)<=0 || (extras[i.id]!==undefined && extras[i.id]!==null && (!Number.isSafeInteger(extras[i.id])||extras[i.id]!<0))))return {ready:false,reason:'Informe um preço válido para cada modelo e custos adicionais válidos, na mesma moeda.'};
 const direction=matches[0]![0]!.direction;
 const rows=items.map((item,index)=>{
  const score=matches[index]![0]!.score,totalCents=prices[item.id]!+(extras[item.id]??0);
  return {id:item.id,score,totalCents,value:(direction==='higher'?score:1/score)/totalCents};
 });
 const best=Math.max(...rows.map(r=>r.value));const performance=direction==='higher'?Math.max(...rows.map(r=>r.score)):Math.min(...rows.map(r=>r.score));
 return {ready:true,rows,winnerIds:rows.filter(r=>Math.abs(r.value-best)<=best*1e-10).map(r=>r.id),performanceIds:rows.filter(r=>r.score===performance).map(r=>r.id)};
}
export const hardwareTitle=(item:Pick<Hardware,'name'|'modelCode'|'variant'>)=>`${item.name} — ${item.modelCode} · ${item.variant}`;
export const displaySpecification=(value:string|number|boolean|null|undefined)=>value===null||value===undefined?'Não confirmado':typeof value==='boolean'?value?'Sim':'Não':typeof value==='number'?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:6}).format(value):value;

export const specificationDisplay=(spec:Specification|undefined)=>!spec||spec.value===null?'Não confirmado':spec.displayValue??displaySpecification(spec.value);
