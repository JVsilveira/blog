import { articleLanguages } from "../features/publication/model";
import { sections } from "../features/publication/i18n";
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Root, RootContent } from 'mdast';
import { z } from 'zod';
import { id, text, timestamp, type Catalog } from '../domain/schemas';
import { categorySlug, PAGE_SIZE } from '../features/blog/model';

export const operationsSchema = z.strictObject({ schemaVersion: z.literal(1), records: z.array(z.strictObject({
  kind: z.enum(['article', 'product']), id, owner: text, reviewer: text.nullable(),
  nextReviewAt: timestamp.nullable(), note: text,
})) });
export function validateOperations(input: unknown, data: Catalog) {
  const operations = operationsSchema.parse(input);
  const seen = new Set<string>();
  for (const record of operations.records) {
    const key = `${record.kind}:${record.id}`;
    if (seen.has(key)) throw new Error(`docs/editorial/controle.json: registro duplicado ${key}`);
    seen.add(key);
    const item = (record.kind === 'article' ? data.articles : data.products).find(item => item.id === record.id);
    if (!item) throw new Error(`docs/editorial/controle.json: referência inexistente ${key}`);
    if (item.status === 'published' && !record.reviewer) throw new Error(`${key}: informe o revisor real antes de publicar`);
  }
  for (const [kind, items] of [['article', data.articles], ['product', data.products]] as const) {
    for (const item of items) if (!seen.has(`${kind}:${item.id}`)) throw new Error(`${kind}:${item.id}: cadastre proprietário/revisor em docs/editorial/controle.json`);
  }
  return operations;
}

// O mesmo parser CommonMark usado por remark-parse/react-markdown, sem renderizar React no servidor.
export function markdownDestinations(body: string) {
  const tree = fromMarkdown(body);
  const definitions = new Map<string, string>();
  function visit(node: Root | RootContent, callback: (node: Root | RootContent) => void) {
    callback(node);
    if ('children' in node) for (const child of node.children) visit(child, callback);
  }
  visit(tree, node => { if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url); });
  const links: { url: string; image: boolean }[] = [];
  visit(tree, node => {
    if (node.type === 'link' || node.type === 'image') links.push({ url: node.url, image: node.type === 'image' });
    if (node.type === 'linkReference' || node.type === 'imageReference') {
      const url = definitions.get(node.identifier);
      if (url) links.push({ url, image: node.type === 'imageReference' });
    }
  });
  return links;
}
export async function validateLocalLinks(root: string, data: Catalog) {
  const routes = new Set<string>();
  async function pages(dir: string, prefix = '') {
    const { readdir } = await import('node:fs/promises');
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      if (entry.isDirectory() && !entry.name.startsWith('[')) await pages(path.join(dir, entry.name), entry.name.startsWith("(") ? prefix : `${prefix}/${entry.name}`);
      if (entry.name === 'page.tsx') routes.add(prefix || '/');
    }
  }
  await pages(path.join(root, 'src/app'));
  const published = data.articles.filter(a => a.status === 'published');
  for (const locale of ['en','es']) {
    routes.add(`/${locale}`);
    for (const section of ['news','opinion','blog']) routes.add(`/${locale}/${section}`);
    for (const topic of sections) routes.add(`/${locale}/sections/${topic}`);
  }
  for (const topic of sections) routes.add(`/editorias/${topic}`);
  for (const a of published) for (const path of Object.values(articleLanguages(a))) routes.add(path!.replace(/\/$/,''));
  for (let page = 1; page <= Math.max(1, Math.ceil(published.length / PAGE_SIZE)); page++) routes.add(`/ajuda/pagina/${page}`);
  for (const category of new Set(published.map(a => a.category))) {
    const base = `/ajuda/categoria/${categorySlug(category)}`;
    routes.add(base);
    for (let page = 1; page <= Math.ceil(published.filter(a => a.category === category).length / PAGE_SIZE); page++) routes.add(`${base}/pagina/${page}`);
  }
  for (const p of data.products.filter(p => p.status !== 'draft')) routes.add(`/recomendacoes/${p.slug}`);
  for (const [file, key, base] of [['phones.json','variants','/celulares'], ['pc-configurations.json','configurations','/pcs/configuracoes']] as const) {
    const input = JSON.parse(await readFile(path.join(root, 'src/data', file), 'utf8'));
    for (const item of input[key]) if (item.status === 'published') routes.add(`${base}/${item.slug}`);
  }
  for (const article of data.articles.flatMap(a=>[a,...(a.translations??[]).map(t=>({...a,body:t.body}))])) for (const link of markdownDestinations(article.body)) {
    const fail = () => { throw new Error(`src/content/articles/${article.slug}/body.md: link/ativo local inválido; use rota pública existente ou arquivo autorizado em public`); };
    if (link.image) throw new Error(`src/content/articles/${article.slug}/body.md: imagens Markdown não têm contrato de direitos; use ativo editorial autorizado com registro específico antes de incluir`);
    if (/^https:/i.test(link.url)) {
      const external = new URL(link.url);
      if (external.username || external.password) fail();
      continue;
    }
    if (/^#[a-zA-Z0-9_-]+$/.test(link.url)) continue;
    if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(link.url)) fail();
    if (/^[a-z][a-z0-9+.-]*:/i.test(link.url) || link.url.startsWith('//') || link.url.includes('\\')) fail();
    const url = new URL(link.url, `https://local.invalid/ajuda/${article.slug}/`);
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/'; } catch { fail(); continue; }
    if (pathname.split('/').includes('..') || pathname.includes('\0')) fail();
    if (!link.image && routes.has(pathname)) continue;
    const target = path.resolve(root, 'public', '.' + pathname);
    if (!target.startsWith(path.resolve(root, 'public') + path.sep)) fail();
    try { if (!(await stat(target)).isFile()) fail(); } catch { fail(); }
  }
}
export async function validateEditorial(root: string, data: Catalog, operations?: unknown) {
  for (const item of [...data.articles, ...data.products].filter(item => item.status === 'published')) {
    if (/PREENCHER|SUBSTITUIR|DATA_ISO|URL_HTTPS_REAL/.test(JSON.stringify(item))) throw new Error(`${item.id}: remova marcadores de template e conclua a pesquisa antes de publicar`);
  }
  validateOperations(operations ?? JSON.parse(await readFile(path.join(root,'docs/editorial/controle.json'), 'utf8')), data);
  await validateLocalLinks(root, data);
}
