import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Inspeciona o artefato, não a configuração do shell: vale também para builds feitos pelo painel.
const root = path.resolve('out');
async function htmlFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(file));
    else if (entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}
const home = await readFile(path.join(root,'index.html'),'utf8');
const robots = await readFile(path.join(root,'robots.txt'),'utf8');
const sitemap = await readFile(path.join(root,'sitemap.xml'),'utf8');
const issues: string[] = [];
const canonical = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
const noindex = (html: string) => /<meta name="robots" content="[^"]*noindex/i.test(html);
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]!);
const paths = new Set<string>();
for (const url of locations) {
  const parsed = new URL(url);
  paths.add(parsed.pathname);
  if (parsed.search || /\/(?:sem-publicacao|admin|auth|api|comparar|montar|orcamentos)(?:\/|$)/.test(parsed.pathname))
    issues.push('Sitemap contém rota privada, filtro ou placeholder.');
}
let indexable = 0, articles = 0;
const titles = new Set<string>();
const descriptions = new Set<string>();
for (const file of await htmlFiles(root)) {
  const html = await readFile(file,'utf8');
  if (noindex(html)) continue;
  indexable++;
  const route = '/' + path.relative(root,file).replaceAll(path.sep,'/').replace(/index\.html$/, '');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const url = canonical(html);
  if (!title || titles.has(title)) issues.push(`${route}: título ausente ou repetido.`);
  if (!description || descriptions.has(description)) issues.push(`${route}: descrição ausente ou repetida.`);
  if (title) titles.add(title);
  if (description) descriptions.add(description);
  if (!url || new URL(url).pathname !== route) issues.push(`${route}: canonical ausente ou divergente.`);
  if (!paths.has(route)) issues.push(`${route}: página indexável ausente do sitemap.`);
  if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) issues.push(`${route}: esperado um título principal.`);
  if (/"@type":"(?:BlogPosting|NewsArticle|OpinionNewsArticle)"/.test(html)) articles++;
}
if (!canonical(home)) issues.push('Definir o domínio HTTPS real e gerar novamente o site.');
if (/Disallow: \/(?:\r?\n|$)/.test(robots) || noindex(home))
  issues.push('Indexação da home bloqueada: revisar aprovação e configuração de lançamento.');
if (!articles) issues.push('Nenhum artigo aprovado e indexável no export atual.');
const result = {
  status: issues.length ? 'preparação ou pendências' : 'verificações locais aprovadas',
  htmlIndexavel: indexable, artigosIndexaveis: articles, urlsNoSitemap: locations.length,
  pendencias: [...new Set(issues)],
  observacao: 'Não comprova indexação real, acesso de bots pelo host ou posicionamento.',
};
console.log(JSON.stringify(result,null,2));
if (process.argv.includes('--production') && issues.length) process.exitCode = 1;
