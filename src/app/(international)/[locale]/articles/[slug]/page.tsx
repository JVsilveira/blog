import { notFound } from 'next/navigation';
import { loadPublicContent } from '../../../../../lib/content';
import { isLocale } from '../../../../../features/publication/i18n';
import { localizeArticle } from '../../../../../features/publication/model';
import { publicationMetadata } from '../../../../../features/publication/metadata';
import { PublicationPage } from '../../../../../features/publication/PublicationPage';
export async function generateStaticParams({params}:{params:{locale:string}}) {if(!isLocale(params.locale))return [];const items=(await loadPublicContent()).articles().filter(a=>localizeArticle(a,params.locale as "en"|"es")).map(a=>({slug:a.slug}));return items.length?items:[{slug:'sem-publicacao'}];}
export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}) {const {locale,slug}=await params;const repo=await loadPublicContent();const a=repo.articleBySlug(slug);if(!isLocale(locale)||!a||!localizeArticle(a,locale))notFound();return publicationMetadata(a,locale,repo.authors().find(author=>author.id===a.authorId)!.name);}
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}) {const {locale,slug}=await params;if(!isLocale(locale))notFound();return <PublicationPage slug={slug} locale={locale}/>;}
