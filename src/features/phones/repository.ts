import { phonesSchema, fields, type Field } from '../../domain/phones/contracts';
import type { Catalog } from '../../domain/schemas';
export function phoneRepository(input:unknown,catalog:Catalog) {
  const data=phonesSchema.parse(input); const ids=new Set<string>(), slugs=new Set<string>();
  for(const p of data.variants) {
    if(ids.has(p.id)||slugs.has(p.slug)||['sem-publicacao','comparar'].includes(p.slug)) throw new Error('Variante duplicada ou slug reservado');
    ids.add(p.id); slugs.add(p.slug);
    if(Date.parse(p.updatedAt)<Date.parse(p.createdAt)) throw new Error('Cronologia da variante inválida');
    const product=catalog.products.find(x=>x.id===p.productId);
    if(!product || product.category!=='phone') throw new Error('Variante exige Product da categoria phone');
    const published=p.status==='published';
    if(published && (product.status!=='published'||product.verificationStatus!=='approved'||!p.verifiedAt||!p.ownerApprovedAt||!p.editorial?.ownerApprovedAt)) throw new Error('Publicação de variante exige produto verificado e aprovação editorial');
    const check=(sourceId:string,field?:string)=> {
      const s=catalog.sources.find(x=>x.id===sourceId);
      if(!s || (published && s.status!=='published') || (field && !s.scope.includes(field))) throw new Error('Fonte ausente, não publicada ou sem escopo do campo');
    };
    for(const field of Object.keys(fields) as Field[]) {
      const sources=p.sourceIds[field] ?? [];
      if(published && p[field]!==null && !sources.length) throw new Error(`Campo sem fonte: ${field}`);
      sources.forEach(s=>check(s,field));
    }
    for(const offerId of p.offerIds) {const offer=catalog.offers.find(o=>o.id===offerId);if(!offer||offer.productId!==p.productId||(published&&offer.status!=='published')) throw new Error('Oferta da variante inválida');}
    p.editorial?.sourceIds.forEach(s=>check(s));
    if(p.updatePolicy) {check(p.updatePolicy.sourceId,'updatePolicy');if(!p.sourceIds.updatePolicy?.includes(p.updatePolicy.sourceId)) throw new Error('Fonte da política deve constar no campo');}
    for(const date of [p.verifiedAt,p.ownerApprovedAt,p.editorial?.ownerApprovedAt,p.updatePolicy?.verifiedAt]) if(date && Date.parse(date)>Date.parse(p.updatedAt)) throw new Error('Verificação/aprovação posterior à revisão');
  }
  const publicItems=data.variants.filter(p=>p.status==='published');
  return {all:()=>structuredClone(publicItems),bySlug:(slug:string)=>structuredClone(publicItems.find(p=>p.slug===slug)??null)};
}
