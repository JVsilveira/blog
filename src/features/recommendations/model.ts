import type { Product, ReviewClaim } from '../../domain/schemas';
export const methods = { 'hands-on': 'Uso e recomendo', documental: 'Análise documental', editorial: 'Configuração editorial' };
export const categories: Record<Product['category'], string> = { phone:'Celular', motherboard:'Placa-mãe', gpu:'Placa de vídeo', case:'Gabinete', cooler:'Cooler', psu:'Fonte', cpu:'Processador', ram:'Memória', storage:'Armazenamento', mouse:'Mouse', keyboard:'Teclado', headset:'Headset', webcam:'Webcam', hub:'Hub', router:'Roteador', monitor:'Monitor' };
export type Recommendation = { product: Product; review: ReviewClaim };
export function recommendations(products: Product[], reviews: ReviewClaim[]): Recommendation[] {
  return products.flatMap(product => {
    const review = reviews.find(r => r.productId === product.id && r.status === 'published' && r.ownerApprovedAt && r.summary && (r.method !== 'hands-on' || r.ownerApprovedAt));
    return review ? [{product,review}] : [];
  });
}
export function filterRecommendations(items: Recommendation[], filters: {use:string; category:string; method:string}) {
  return items.filter(({product,review}) => (!filters.use || review.uses.includes(filters.use)) && (!filters.category || product.category === filters.category) && (!filters.method || review.method === filters.method));
}
