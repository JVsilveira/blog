import { notFound } from 'next/navigation';
import { PortalPage, sectionPath } from '../../../../../features/publication/PortalPage';
import { collectionMetadata } from '../../../../../features/publication/metadata';
import { copy, isLocale, sections } from '../../../../../features/publication/i18n';
export function generateStaticParams(){return sections.map(topic=>({topic}));}
async function values(params:Promise<{locale?:string;topic:string}>){const p=await params;const locale=p.locale??'pt';if(!isLocale(locale)||!sections.includes(p.topic as typeof sections[number]))notFound();return {locale,topic:p.topic as typeof sections[number]};}
export async function generateMetadata({params}:{params:Promise<{locale?:string;topic:string}>}){const {locale,topic}=await values(params);return collectionMetadata(locale,copy[locale][topic],sectionPath(topic,locale),undefined,topic);}
export default async function Page({params}:{params:Promise<{locale?:string;topic:string}>}){const {locale,topic}=await values(params);return <PortalPage locale={locale} section={topic}/>;}
