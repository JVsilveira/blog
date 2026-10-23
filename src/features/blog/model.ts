import type { Article } from '../../domain/schemas';
export const PAGE_SIZE = 6;
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
export const categorySlug = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export type SearchEntry = Pick<Article, 'slug' | 'title' | 'description' | 'tags' | 'category' | 'kind'>;
export const searchArticles = (items: SearchEntry[], term: string, category = '') => {
  const words = normalize(term.trim()).split(/\s+/).filter(Boolean);
  return items.filter(a => (!category || a.category === category) && words.every(word => normalize([a.title, a.description, ...a.tags].join(' ')).includes(word)));
};
export const ordered = (items: Article[]) => [...items].sort((a,b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.slug.localeCompare(b.slug));
export function paginate(items: Article[], page: number) {
  const count = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (!Number.isSafeInteger(page) || page < 1 || page > count) return null;
  return { items: ordered(items).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), count };
}
export const dateBR = (date: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(date));

export function articleHeadings(body: string) {
  let fence = false;
  const headings: {id:string; title:string}[] = [];
  for (const [i,line] of body.split('\n').entries()) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
    const match = !fence && /^##\s+(.+)$/.exec(line);
    if (match) headings.push({id:`secao-${i+1}`,title:match[1]!});
  }
  return headings;
}
