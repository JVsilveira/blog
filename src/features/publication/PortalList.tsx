"use client";
import { useState } from 'react';
import { categoryLabel, copy, publicationPath, type Locale, type PublicationKind } from './i18n';
import { filterPublications } from './model';
import { normalize } from '../blog/model';
export type PublicEntry={slug:string;title:string;description:string;category:string;kind?:PublicationKind;featuredOrder?:number|null};
export function PortalList({entries,locale}:{entries:PublicEntry[];locale:Locale}) {
 const [query,setQuery]=useState('');const [term,setTerm]=useState('');const [category,setCategory]=useState('');
 const localized=entries.map(a=>({...a,category:categoryLabel(a.category,locale)}));
 const categories=Array.from(new Map(localized.map(a=>[normalize(a.category),a.category])).values()).sort((a,b)=>a.localeCompare(b,locale));
 const found=filterPublications(localized,term,category);
 const c=copy[locale];
 return <>
  <form className="publication-filters" role="search" onSubmit={event=>{event.preventDefault();setTerm(query);}}>
   <label className="portal-search">{c.search}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} maxLength={200}/></label>
   <label className="portal-category">{c.topics}<select value={category} onChange={e=>setCategory(e.target.value)}>
    <option value="">{c.allCategories}</option>{categories.map(value=><option key={value} value={value}>{value}</option>)}
   </select></label>
   <button className="button" type="submit">{c.searchButton}</button>
   {(query || term || category) && <button className="button secondary" type="button" onClick={()=>{setQuery('');setTerm('');setCategory('');}}>{c.clear}</button>}
  </form>
  <p className="publication-results" role="status">{found.length} {c.results}</p>
  {found.length ? <div className="publication-list">{found.map((a,index)=><article key={a.slug} className={index===0 && a.kind && a.kind!=='blog'?'publication-lead':undefined}>
    <p className="publication-type">{a.category}</p>
    <h2><a href={publicationPath(a.slug,locale,a.kind)}>{a.title}</a></h2><p>{a.description}</p>
  </article>)}</div>:<p className="empty">{entries.length?c.noResults:c.empty}</p>}
 </>;
}
