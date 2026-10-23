import { notFound } from 'next/navigation';
import { loadPCs } from '../../../../../lib/pcs';
import { PCDetail } from '../../../../../features/pc-builder/Views';
import { listingMetadata } from '../../../../../features/blog/metadata';
import { site } from '../../../../../config/site';
export async function generateStaticParams(){const {configurations}=await loadPCs();const items=configurations.all();return items.length?items.map(c=>({slug:c.slug})):[{slug:'sem-publicacao'}];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {configurations}=await loadPCs();const c=configurations.bySlug((await params).slug);if(!c)notFound();return listingMetadata(c.title,c.summary,`/pcs/configuracoes/${c.slug}/`);}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {configurations,repo}=await loadPCs();const c=configurations.bySlug((await params).slug);if(!c)notFound();return <PCDetail configuration={c} products={repo.products()} sources={repo.sources()} offers={repo.products().flatMap(p=>repo.offersFor(p.id))} now={new Date()} affiliates={site.features.affiliates}/>;}
