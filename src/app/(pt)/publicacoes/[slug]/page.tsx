import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../lib/content';
import { publicationMetadata } from '../../../../features/publication/metadata';
import { PublicationPage } from '../../../../features/publication/PublicationPage';
export async function generateStaticParams(){const items=(await loadPublicContent()).articles().filter(a=>a.kind && a.kind!=='blog').map(a=>({slug:a.slug}));return items.length?items:[{slug:'sem-publicacao'}];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;const repo=await loadPublicContent();const a=repo.articleBySlug(slug);if(!a || (a.kind??'blog')==='blog')notFound();return publicationMetadata(a,'pt',repo.authors().find(author=>author.id===a.authorId)!.name);}
export default async function Page({params}:{params:Promise<{slug:string}>}) {return <PublicationPage slug={(await params).slug} locale="pt"/>;}
