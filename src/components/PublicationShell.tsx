import Link from "next/link";
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { copy, localeTags, type Locale } from '../features/publication/i18n';
export function PublicationShell({locale,children}:{locale:Locale;children:ReactNode}) {
 const c=copy[locale];
 return <html lang={localeTags[locale]}><body><a className="skip" href="#conteudo">{c.skip}</a><Header locale={locale}/>{children}{locale==='pt'?<Footer/>:<footer className="site-footer"><nav aria-label={c.choose}><Link href="/">Português</Link><Link href="/en/">English</Link><Link href="/es/">Español</Link></nav><nav aria-label={c.methodology}><Link href="/metodologia/" lang="pt-BR">{c.methodology} (Português)</Link></nav></footer>}</body></html>;
}
