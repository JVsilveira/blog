import { copy, categoryLabel, kindLabel, homePath, localeTags, type Locale } from '../publication/i18n';
import { LanguageChoice } from '../publication/LanguageChoice';
import { articleLanguages } from '../publication/model';
import { ViewMetric } from '../monetization/ViewMetric';
import { AdSlot } from '../monetization/AdSlot';
import Markdown from 'react-markdown';
import Link from 'next/link';
import type { Article, SourceReference } from '../../domain/schemas';
import { methods, type Recommendation } from '../recommendations/model';
import { CopyCode } from './CopyCode';
import { articleHeadings } from './model';
export function ArticleView({ article: a, author, sources, related, products = [], locale='pt', original=a }: { article: Article; author: string; sources: SourceReference[]; related: Article[]; products?: Recommendation[]; locale?:Locale; original?:Article }) {
  const headings = articleHeadings(a.body);
  const c=copy[locale];
  const formatDate=(date:string)=>new Intl.DateTimeFormat(localeTags[locale],{dateStyle:'long',timeZone:'America/Sao_Paulo'}).format(new Date(date));
  return <main id="conteudo" tabIndex={-1} className="article-page">
    <nav aria-label="Caminho da página"><Link href={homePath(locale)}>{c.home}</Link> / <span aria-current="page">{a.title}</span></nav>
    <ViewMetric kind="article" id={a.id}/><article><header><p className="publication-type">{kindLabel(a.kind,locale)} / {categoryLabel(a.category,locale)}</p><h1>{a.title}</h1><p className="intro">{a.description}</p><p>{c.by} {author} · {c.published} <time dateTime={a.publishedAt!}>{formatDate(a.publishedAt!)}</time> · {c.updated} <time dateTime={a.updatedAt}>{formatDate(a.updatedAt)}</time></p></header>
    <LanguageChoice locale={locale} links={articleLanguages(original)}/>
    {locale!=='pt' && <p className="translation-note">{c.translation}</p>}
    {a.kind==='opinion' && <aside className="opinion-note">{c.opinionNote}</aside>}
    <aside className="reading-note"><h2>{c.method}</h2><p>{a.methodology}</p><p>{a.limitations}</p></aside>
    {headings.length > 0 && <nav aria-label={c.contents}><h2>{c.contents}</h2><ul>{headings.map(h => <li key={h.id}><a href={`#${h.id}`}>{h.title}</a></li>)}</ul></nav>}
    <div className="article-body"><Markdown skipHtml urlTransform={url => {
      if (/^#[a-zA-Z0-9_-]+$/.test(url) || /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(url)) return url;
      try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? url : undefined; } catch { return undefined; }
    }} components={{
      h2: ({children, node}) => <h2 id={`secao-${node?.position?.start.line}`}>{children}</h2>,
      h1: ({children}) => <h2>{children}</h2>,
      img: ({alt}) => <span>Imagem não publicada: {alt}. Capturas exigem autorização e cadastro de direitos.</span>,
      pre: ({children}) => <pre tabIndex={0}>{children}</pre>,
      code: ({children, className}) => { const text = String(children); return <><code className={className}>{children}</code>{text.includes('\n') && <CopyCode text={text} />}</>; },
    }}>{a.body}</Markdown></div>
    <section><h2>{c.sources}</h2><ul>{sources.map(s => <li key={s.id}><a href={s.url} rel="noopener noreferrer">{s.publisher}</a> — {s.scope.join('; ')}. {formatDate(s.accessedAt)}.{s.note && <p>{s.note}</p>}</li>)}</ul></section>
    {related.length > 0 && <section><h2>{c.related}</h2><ul>{related.map(r => <li key={r.slug}><Link href={`/ajuda/${r.slug}/`}>{r.title}</Link></li>)}</ul></section>}
    {locale==='pt' && (products.length > 0 ? <section><h2>Recomendações relacionadas</h2><ul>{products.map(({product,review}) => <li key={product.id}><Link href={`/recomendacoes/${product.slug}/`}>{product.name}</Link> — {methods[review.method]}. {review.summary}{product.status === 'archived' && ' Produto arquivado; orientação histórica.'}</li>)}</ul></section> : a.relatedProductIds.length > 0 && <p>Não há recomendações revisadas disponíveis para os produtos relacionados.</p>)}
    <Link href={homePath(locale)}>{c.back}</Link>
    <AdSlot placement="article-end" /></article>
  </main>;
}
