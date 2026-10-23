import Link from "next/link";
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { copy, localeTags, type Locale } from '../features/publication/i18n';
import { site } from '../config/site';
export function PublicationShell({locale,children}:{locale:Locale;children:ReactNode}) {
 const c=copy[locale];
 return <html lang={localeTags[locale]}><body><a className="skip" href="#conteudo">{c.skip}</a><Header locale={locale}/>{children}{locale==='pt'?<Footer/>:<footer className="site-footer"><div><strong>{site.name}</strong><p>{c.footer}</p></div><nav aria-label={c.choose}><Link href="/">Português</Link><Link href="/en/">English</Link><Link href="/es/">Español</Link></nav><Link href="/metodologia/" lang="pt-BR">{c.methodology} (Português)</Link></footer>}</body></html>;
}
