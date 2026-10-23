import { notFound } from 'next/navigation';
import { PortalPage } from '../../../../features/publication/PortalPage';
import { collectionMetadata } from '../../../../features/publication/metadata';
import { copy, isLocale, type PublicationKind } from '../../../../features/publication/i18n';
export function generateStaticParams(){return ['news','opinion','blog'].map(section=>({section}));}
function kindOf(section:string):PublicationKind {if(!['news','opinion','blog'].includes(section))notFound();return section as PublicationKind;}
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string}>}) {const {locale,section}=await params;if(!isLocale(locale))notFound();const kind=kindOf(section);return collectionMetadata(locale,copy[locale][kind],`/${locale}/${section}/`,kind);}
export default async function Page({params}:{params:Promise<{locale:string;section:string}>}) {const {locale,section}=await params;if(!isLocale(locale))notFound();return <PortalPage locale={locale} kind={kindOf(section)}/>;}
