import { catalogSchema, type Catalog } from '../domain/schemas';

export function validateCatalog(input: unknown): Catalog {
  const data = catalogSchema.parse(input);
  const fail = (path: string, message: string): never => { throw new Error(`${path}: ${message}`); };
  for (const [collection, records] of Object.entries(data)) {
    if (!Array.isArray(records)) continue;
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const record of records) {
      if (ids.has(record.id)) fail(collection, `ID duplicado ${record.id}`);
      ids.add(record.id);
      if ('slug' in record) {
        if (slugs.has(record.slug)) fail(collection, `slug duplicado ${record.slug}`);
        slugs.add(record.slug);
      }
      if (Date.parse(record.updatedAt) < Date.parse(record.createdAt)) fail(`${collection}.${record.id}`, 'updatedAt anterior a createdAt');
    }
  }
  const reference = (path: string, targetId: string, targets: { id: string; status: string }[], published: boolean) => {
    const target = targets.find(item => item.id === targetId);
    if (!target) fail(path, `referência inexistente ${targetId}`);
    if (published && target!.status !== 'published' && !(targets === data.products && target!.status === 'archived')) fail(path, `referência não publicada ${targetId}`);
  };
  for (const record of [...data.products, ...data.articles]) {
    for (const sourceId of record.sourceIds) reference(record.id + '.sourceIds', sourceId, data.sources, record.status === 'published');
  }
  for (const product of data.products) {
    if (product.slug === 'sem-publicacao') fail(product.id, 'slug reservado');
    if ((product.status === 'published' || product.status === 'archived') && (product.editorialStatus !== 'published' || product.verificationStatus !== 'approved' || !product.verifiedAt || !product.ownerApprovedAt || !product.sourceIds.length)) fail(product.id, 'publicação exige verificação, fontes e aprovação editorial');
  }
  const categories = new Map<string,string>();
  const publicTitles = new Set<string>();
  const publicDescriptions = new Set<string>();
  for (const article of data.articles) {
    const translatedLanguages=new Set<string>();
    for(const translation of article.translations ?? []) {
      if(translatedLanguages.has(translation.language)) fail(article.id,'tradução duplicada por idioma');
      translatedLanguages.add(translation.language);
      if (/<\/?[a-z][^>]*>/i.test(translation.body) || /\]\(\s*(?:javascript|data|file):/i.test(translation.body)) fail(article.id,'HTML ou link perigoso em tradução');
    }
    const key = article.category.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (!key || key === 'sem-publicacao' || (categories.has(key) && categories.get(key) !== article.category)) fail(article.id, 'categoria vazia, reservada ou com slug ambíguo');
    categories.set(key,article.category);
    if (article.status === 'published') {
      if (publicTitles.has(article.title) || publicDescriptions.has(article.description)) fail(article.id, 'título e descrição públicos devem ser únicos');
      publicTitles.add(article.title); publicDescriptions.add(article.description);
    }
    if (article.slug === 'sem-publicacao' || article.category.toLowerCase() === 'sem-publicacao') fail(article.id, 'nome reservado para export vazio');
    if (article.publishedAt && Date.parse(article.updatedAt) < Date.parse(article.publishedAt)) fail(article.id, 'revisão anterior à publicação');
    reference(article.id + '.authorId', article.authorId, data.authors, article.status === 'published');
    if (article.status === 'published' && !data.authors.find(a => a.id === article.authorId)?.ownerApprovedAt) fail(article.id, 'autor sem aprovação');
    for (const productId of article.relatedProductIds) reference(article.id + '.relatedProductIds', productId, data.products, article.status === 'published');
    if (/<\/?[a-z][^>]*>/i.test(article.body) || /\]\(\s*(?:javascript|data|file):/i.test(article.body)) fail(article.id + '.body', 'HTML ou link perigoso não permitido');
  }
  for (const offer of data.offers) {
    reference(offer.id + '.productId', offer.productId, data.products, offer.status === 'published');
    reference(offer.id + '.sourceId', offer.sourceId, data.sources, offer.status === 'published');
    if (offer.authorization) reference(offer.id + '.authorization', offer.authorization.sourceId, data.sources, offer.status === 'published');
  }
  const reviewed = new Set<string>();
  for (const review of data.reviews) {
    reference(review.id + '.productId', review.productId, data.products, review.status === 'published');
    for (const alternative of review.alternativeProductIds) {
      reference(review.id + '.alternativeProductIds', alternative, data.products, review.status === 'published');
      if (alternative === review.productId) fail(review.id, 'alternativa não pode ser o próprio produto');
    }
    if (review.status === 'published') {
      if (!review.ownerApprovedAt || !review.summary || !review.bestFor.length || !review.cons.length || !review.avoidIf.length || !review.uses.length) fail(review.id, 'recomendação exige aprovação, resumo, usos e limitações');
      if (reviewed.has(review.productId)) fail(review.id, 'avaliação pública duplicada');
      reviewed.add(review.productId);
    }
  }
  return data;
}

// A fronteira pública nunca retorna o catálogo bruto, nem referências a drafts.
export function createPublicRepository(input: unknown) {
  const data = validateCatalog(input);
  const products = data.products.filter(p => p.status === 'published' && p.editorialStatus === 'published' && p.verificationStatus === 'approved');
  const retainedProducts = data.products.filter(p => p.status === 'archived' && p.editorialStatus === 'published' && p.verificationStatus === 'approved');
  const detailProducts = [...products, ...retainedProducts];
  const articles = data.articles.filter(a => a.status === 'published').map(a => ({...a,translations:(a.translations ?? []).filter(t => t.status==='published' && t.reviewedAt && t.sourceUpdatedAt===a.updatedAt)}));
  const productIds = new Set(products.map(p => p.id));
  return {
    products: () => structuredClone(products),
    recommendationProducts: () => structuredClone(detailProducts),
    productBySlug: (slug: string) => structuredClone(detailProducts.find(p => p.slug === slug) ?? null),
    articles: () => structuredClone(articles),
    articleBySlug: (slug: string) => structuredClone(articles.find(a => a.slug === slug) ?? null),
    articleParams: () => articles.filter(a=>(a.kind ?? 'blog')==='blog').map(a => ({ slug: a.slug })),
    searchIndex: () => articles.map(({ slug, title, description, tags }) => ({ slug, title, description, tags: [...tags] })),
    sources: () => structuredClone(data.sources.filter(s => s.status === 'published')),
    authors: () => structuredClone(data.authors.filter(a => a.status === 'published' && a.ownerApprovedAt)),
    reviews: () => structuredClone(data.reviews.filter(r => r.status === 'published' && detailProducts.some(p => p.id === r.productId))),
    offersFor: (productId: string) => structuredClone(data.offers.filter(o => productIds.has(productId) && o.productId === productId && o.status === 'published' && o.enabled && o.verifiedAt !== null).sort((a,b) => a.editorialOrder - b.editorialOrder || a.id.localeCompare(b.id))),
  };
}
