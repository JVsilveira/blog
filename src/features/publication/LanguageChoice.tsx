"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { copy, type Locale, preferredLocale, homePath, isLocale } from './i18n';
const storageKey='portal-language';
export function LanguageChoice({locale,links,automatic=false}:{locale:Locale;links:Partial<Record<Locale,string>>;automatic?:boolean}) {
 const pathname=usePathname();
 useEffect(()=>{
  if(!automatic || pathname!=='/')return;
  let saved:string|null=null;
  try{saved=localStorage.getItem(storageKey);}catch{}
  const target=saved && isLocale(saved)?saved:preferredLocale(navigator.languages);
  if(target!=='pt')window.location.replace(homePath(target));
 },[automatic,pathname]);
 return <nav className="language-choice" aria-label={copy[locale].choose}>
  {(['pt','en','es'] as const).map(language=>links[language] ? <a key={language} href={links[language]} lang={language==='pt'?'pt-BR':language} hrefLang={language==='pt'?'pt-BR':language} aria-current={language===locale?'page':undefined} onClick={()=>{try{localStorage.setItem(storageKey,language);}catch{}}}>{({pt:'Português',en:'English',es:'Español'})[language]}</a>:null)}
 </nav>;
}
