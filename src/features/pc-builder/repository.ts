import { configurationsSchema } from '../../domain/pc/contracts';
import { resolveSelection } from '../../domain/pc/evaluate';
import type { Product, SourceReference } from '../../domain/schemas';
export function configurationRepository(input:unknown,products:Product[],sources:SourceReference[]) {
  const {configurations}=configurationsSchema.parse(input);
  const ids=new Set<string>(),slugs=new Set<string>();
  for(const c of configurations) {
    if(ids.has(c.id)||slugs.has(c.slug)||c.slug==='sem-publicacao') throw new Error('Configuração duplicada ou slug reservado');
    ids.add(c.id); slugs.add(c.slug);
    if(Date.parse(c.updatedAt)<Date.parse(c.createdAt)) throw new Error('Cronologia inválida');
    if(c.status!=='published') continue;
    if(!c.ownerApprovedAt||!c.sourceIds.length) throw new Error('Configuração publicada exige aprovação e fontes');
    const selected=resolveSelection(c.selection,products);
    if(!selected.ok) throw new Error(selected.message);
    for(const productId of Object.values(c.selection.components).filter(Boolean)) {
      const p=products.find(p=>p.id===productId);
      if(!p||p.status!=='published'||p.verificationStatus!=='approved'||!p.ownerApprovedAt||!c.reasons[productId!]) throw new Error('Componente exige verificação, aprovação e motivo editorial');
    }
    for(const alternative of c.alternatives) {
      const p=products.find(p=>p.id===alternative.productId);
      if(!p||p.category!==alternative.slot||p.status!=='published'||p.verificationStatus!=='approved') throw new Error('Alternativa inválida');
    }
    const referenced=[...c.sourceIds,...products.filter(p=>Object.values(c.selection.components).includes(p.id)).flatMap(p=>p.specs.category==='motherboard'?p.specs.cpuSupport?.flatMap(s=>s.sourceIds)??[]:p.specs.category==='psu'?p.specs.specificationSourceIds:[])];
    if(referenced.some(id=>!sources.some(s=>s.id===id&&s.status==='published'))) throw new Error('Fonte ausente ou não publicada');
  }
  const published=configurations.filter(c=>c.status==='published');
  return {all:()=>structuredClone(published),bySlug:(slug:string)=>structuredClone(published.find(c=>c.slug===slug)??null)};
}
