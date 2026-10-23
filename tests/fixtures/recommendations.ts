import { fixture } from './catalog';
export function recommendationFixture() {
  const data = fixture();
  const p = data.products[0]!;
  data.reviews = [{id:'review-test',schemaVersion:1,status:'published',createdAt:p.createdAt,updatedAt:p.updatedAt,productId:p.id,method:'documental',ownerApprovedAt:p.ownerApprovedAt,summary:'Resumo sintético exclusivo de teste.',uses:['Estudar'],pros:['Ponto sintético'],cons:['Limitação sintética'],bestFor:['Cenário sintético'],avoidIf:['Condição sintética'],alternativeProductIds:[]}];
  return data;
}
