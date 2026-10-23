import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { validateCatalog, createPublicRepository } from './catalog';
export async function loadContent(root = process.cwd()) {
  const catalog: unknown = JSON.parse(await readFile(path.join(root, 'src/data/catalog.json'), 'utf8'));
  const directory = path.join(root, 'src/content/articles');
  const articles: unknown[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(directory, entry.name);
    const metadata = JSON.parse(await readFile(path.join(folder, 'article.json'), 'utf8'));
    if (metadata.slug !== entry.name) throw new Error(`${entry.name}: diretório deve corresponder ao slug`);
    if ('body' in metadata) throw new Error(`${entry.name}: body pertence ao arquivo body.md`);
    articles.push({ ...metadata, body: await readFile(path.join(folder, 'body.md'), 'utf8') });
  }
  const data = validateCatalog({ ...(catalog as object), articles });
  for (const product of data.products) for (const image of product.images) {
    try { await access(path.join(root, 'public', image.src)); }
    catch { throw new Error(`${product.id}.images: ativo local ausente ${image.src}`); }
  }
  return data;
}
export async function loadPublicContent() { return createPublicRepository(await loadContent()); }
