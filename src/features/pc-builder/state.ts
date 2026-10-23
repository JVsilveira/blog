import { selectionSchema, slots, type Selection, type Slot } from '../../domain/pc/contracts';
import { resolveSelection } from '../../domain/pc/evaluate';
import type { Product } from '../../domain/schemas';
export const storageKey='portal-tech:pc:v1';
export const maxSelectionLength=2400;
export const slotNames:Record<Slot,string>={cpu:'Processador',motherboard:'Placa-mãe',ram:'Memória RAM',gpu:'Placa de vídeo',storage:'Armazenamento',psu:'Fonte',case:'Gabinete',cooler:'Cooler'};
export const emptySelection=():Selection=>({schemaVersion:1,components:{cpu:null,motherboard:null,ram:null,gpu:null,storage:null,psu:null,case:null,cooler:null}});
export function serializeSelection(selection:Selection){
  const value=JSON.stringify(selectionSchema.parse(selection));
  if(value.length>maxSelectionLength) throw new Error('Seleção excede o limite de tamanho.');
  return value;
}
// v1 é a versão inicial. Versões futuras exigem migração explícita; nunca adivinhar IDs.
export function importSelection(value:string,products:Product[]){
  if(value.length>maxSelectionLength) return {ok:false as const,message:'Seleção excede o limite de tamanho.'};
  try{return resolveSelection(JSON.parse(value),products);}catch{return {ok:false as const,message:'Seleção inválida. Revise o link ou o salvamento.'};}
}
export function encodeSelection(selection:Selection){return encodeURIComponent(serializeSelection(selection));}
export function decodeSelection(value:string,products:Product[]){
  if(value.length>maxSelectionLength*3) return {ok:false as const,message:'Link excede o limite de tamanho.'};
  try{return importSelection(decodeURIComponent(value),products);}catch{return {ok:false as const,message:'Link inválido.'};}
}
export function selectedComplete(selection:Selection){return slots.filter(s=>s!=='gpu'&&s!=='cooler').every(s=>selection.components[s]!==null);}
