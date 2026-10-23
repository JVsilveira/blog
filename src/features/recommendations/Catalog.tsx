'use client';
import Link from 'next/link';
import { useState } from 'react';
import { categories, methods, filterRecommendations, type Recommendation } from './model';
export function Catalog({items}: {items:Recommendation[]}) {
  const [filters,setFilters] = useState({use:'',category:'',method:''});
  const visible = filterRecommendations(items,filters);
  return <>
    {items.length > 0 && <fieldset className="recommendation-filters"><legend>Filtrar recomendações</legend>
      <label>Uso<select value={filters.use} onChange={e => setFilters({...filters,use:e.target.value})}><option value="">Todos os usos</option>{[...new Set(items.flatMap(i => i.review.uses))].sort().map(use => <option key={use}>{use}</option>)}</select></label>
      <label>Categoria<select value={filters.category} onChange={e => setFilters({...filters,category:e.target.value})}><option value="">Todas as categorias</option>{[...new Set(items.map(i => i.product.category))].map(c => <option key={c} value={c}>{categories[c]}</option>)}</select></label>
      <label>Método<select value={filters.method} onChange={e => setFilters({...filters,method:e.target.value})}><option value="">Todos os métodos</option>{Object.entries(methods).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button type="button" className="button" onClick={() => setFilters({use:'',category:'',method:''})}>Limpar filtros</button>
    </fieldset>}
    <p role="status">{visible.length} recomendações disponíveis.</p>
    {visible.length ? <div className="guide-list">{visible.map(({product,review}) => <article key={product.id} className="editorial-card"><p>{categories[product.category]} · {methods[review.method]}</p><h2><Link href={`/recomendacoes/${product.slug}/`}>{product.name}</Link></h2><p>{review.summary}</p></article>)}</div> : <p className="empty">{items.length ? 'Nenhuma recomendação corresponde aos filtros. Tente limpar os filtros.' : 'Ainda não há recomendações revisadas. Produtos só aparecem após verificação e aprovação editorial.'}</p>}
  </>;
}
