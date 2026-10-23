'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { analytics } from '../../lib/analytics';
import { searchArticles, type SearchEntry } from './model';
import { Button, Input, Select } from '../../components/ui';
export function BlogSearch() {
  const index = useRef<SearchEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<SearchEntry[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  async function search() {
    setState('loading');
    try {
      if (!index.current) {
        const response = await fetch('/indice-busca.json');
        if (!response.ok) throw new Error('Índice indisponível');
        index.current = await response.json() as SearchEntry[];
      }
      setItems((index.current ?? []).filter(a=>(a.kind??'blog')==='blog')); setTerm(query); setState('success');
    } catch { setState('error'); }
  }
  const found = searchArticles(items, term, category);
  return <section className="blog-search" aria-label="Busca local">
    <form role="search" className="search-form" onSubmit={e => { e.preventDefault(); void search(); }}>
      <Input id="busca-blog" type="search" label="Buscar por título, resumo ou assunto" value={query} onChange={e => setQuery(e.target.value)} maxLength={200} />
      <Button type="submit" disabled={state === 'loading'}>Buscar guias</Button>
    </form>
    {state === 'success' && items.length > 0 && <Select id="categoria-busca" label="Filtrar resultados por categoria" value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas</option>{[...new Set(items.map(a => a.category))].map(c => <option key={c}>{c}</option>)}</Select>}
    <p role="status">{state === 'loading' ? 'Carregando índice…' : state === 'error' ? 'Não foi possível carregar a busca. Tente novamente ou use a listagem abaixo.' : state === 'success' ? `${found.length} guia(s) encontrado(s).` : 'Busca local, sem envio do termo a terceiros.'}</p>
    {state === 'success' && <><Button onClick={() => { setQuery(''); setTerm(''); setCategory(''); setState('idle'); }}>Limpar busca e filtros</Button>{found.length ? <ul>{found.map(a => <li key={a.slug}><Link href={`/ajuda/${a.slug}/`} onClick={()=>analytics.track({name:'search_result_open',contentId:a.slug})}>{a.title}</Link><p>{a.description}</p></li>)}</ul> : <p>Nenhum guia encontrado. Tente outro termo ou limpe a busca.</p>}</>}
    <noscript>A busca precisa de JavaScript. Leia os guias pela listagem e pelas categorias abaixo.</noscript>
  </section>;
}
