import { notFound } from 'next/navigation';
import { isLocale } from '../../../features/publication/i18n';
import { editionMetadata } from '../../../features/publication/metadata';
import { PortalPage } from '../../../features/publication/PortalPage';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {const {locale}=await params;if(!isLocale(locale))notFound();return editionMetadata(locale);}
export default async function Page({params}:{params:Promise<{locale:string}>}) {const {locale}=await params;if(!isLocale(locale))notFound();return <PortalPage locale={locale}/>;}
