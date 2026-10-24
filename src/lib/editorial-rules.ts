import {fromMarkdown} from 'mdast-util-from-markdown';
import type {Root,RootContent} from 'mdast';
import {z} from 'zod';
import {id,text,timestamp,type Catalog} from '../domain/schemas';

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
