import { notFound } from 'next/navigation';
import { PublicationShell } from '../../../components/PublicationShell';
import { isLocale } from '../../../features/publication/i18n';
import { baseMetadata } from '../../../lib/site-metadata';
import '../../globals.css';
export const metadata=baseMetadata;
export function generateStaticParams(){return [{locale:'en'},{locale:'es'}];}
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) {
 const {locale}=await params;if(!isLocale(locale)||locale==='pt')notFound();
 return <PublicationShell locale={locale}>{children}</PublicationShell>;
}
