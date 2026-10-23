import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadPhones } from '../../../../lib/phones';
import { PhoneEditorial, PhoneOffers, PhoneTable } from '../../../../features/phones/Views';
import { title } from '../../../../domain/phones/compare';
import { listingMetadata } from '../../../../features/blog/metadata';
export async function generateStaticParams(){const {phones}=await loadPhones();const items=phones.all().map(p=>({slug:p.slug}));return items.length?items:[{slug:'sem-publicacao'}];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {phones,catalog}=await loadPhones();const p=phones.bySlug((await params).slug);if(!p)notFound();const product=catalog.products().find(x=>x.id===p.productId)!;return listingMetadata(title(p,product.name),p.editorial!.summary,`/celulares/${p.slug}/`);}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {phones,catalog}=await loadPhones();const p=phones.bySlug((await params).slug);if(!p)notFound();const product=catalog.products().find(x=>x.id===p.productId)!;return <main id="conteudo" tabIndex={-1} className="blog-page article-body"><Link href="/celulares/">Catálogo de celulares</Link><h1>{title(p,product.name)}</h1><Link href={`/celulares/comparar/?modelos=${p.id}`}>Comparar esta variante</Link><PhoneEditorial level={2} phone={p} sources={catalog.sources()}/><h2>Ficha da variante</h2><PhoneTable phones={[p]} names={{[product.id]:product.name}} sources={catalog.sources()} today={new Date().toISOString().slice(0,10)}/><PhoneOffers phone={p} offers={catalog.offersFor(p.productId).filter(o=>p.offerIds.includes(o.id))} now={new Date()}/></main>;}
