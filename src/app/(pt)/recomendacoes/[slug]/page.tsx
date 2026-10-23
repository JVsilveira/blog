import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../lib/content';
import { recommendations } from '../../../../features/recommendations/model';
import { Detail } from '../../../../features/recommendations/Detail';
import { listingMetadata } from '../../../../features/blog/metadata';
import { site } from '../../../../config/site';
export async function generateStaticParams() {
  const repo = await loadPublicContent();
  const slugs = repo.recommendationProducts().filter(p => recommendations([p],repo.reviews()).length).map(p => ({slug:p.slug}));
  return slugs.length ? slugs : [{slug:'sem-publicacao'}];
}
export async function generateMetadata({params}: {params:Promise<{slug:string}>}) {
  const repo = await loadPublicContent(); const p = repo.productBySlug((await params).slug); if (!p) notFound();
  const item = recommendations([p],repo.reviews())[0]; if (!item) notFound();
  return listingMetadata(p.name,item.review.summary!,`/recomendacoes/${p.slug}/`);
}
export default async function Page({params}: {params:Promise<{slug:string}>}) {
  const repo = await loadPublicContent(); const p = repo.productBySlug((await params).slug); if (!p) notFound();
  const item = recommendations([p],repo.reviews())[0]; if (!item) notFound();
  return <Detail item={item} offers={repo.offersFor(p.id)} sources={repo.sources().filter(s => p.sourceIds.includes(s.id))} alternatives={recommendations(repo.products(),repo.reviews()).filter(a => item.review.alternativeProductIds.includes(a.product.id))} now={new Date()} affiliatesEnabled={site.features.affiliates} />;
}
