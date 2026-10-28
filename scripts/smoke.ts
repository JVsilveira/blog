import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
// Host de teste deliberadamente sem fallback SPA: URL ausente responde 404.
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const file = path.resolve(
    "out",
    "." +
      (url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname),
  );
  if (!file.startsWith(path.resolve("out") + path.sep)) {
    res.writeHead(404).end();
    return;
  }
  try {
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end(await readFile("out/404.html"));
  }
});
server.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
try {
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /Ainda não há conteúdo revisado disponível/);
  assert.doesNotMatch(html, /CPU sintética|Artigo sintético|example\.org/);
  for (const route of ["/celulares/sem-publicacao/", "/celulares/variant-test/", "/celulares/inexistente/", "/pcs/configuracoes/pc-test/", "/pcs/configuracoes/sem-publicacao/", "/recomendacoes/sem-publicacao/", "/recomendacoes/product-test/", "/recomendacoes/inexistente/", "/ajuda/slug-inexistente/", "/ajuda/article-test/", "/ajuda/backup-antes-de-configurar/", "/ajuda/backup-windows-escopo/", "/ajuda/sem-publicacao/", "/ajuda/pagina/0/", "/ajuda/categoria/sem-publicacao/"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Página não encontrada/);
  }
  for (const route of [
    "sobre",
    "contato",
    "metodologia",
    "afiliados",
    "privacidade",
    "termos",
  ]) {
    const response = await fetch(`${base}/${route}/`);
    assert.equal(response.status, 200, route);
    const body = await response.text();
    assert.match(body, /Rascunho institucional/);
    assert.match(body, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(body, /<form|mailto:|example\.org/);
  }
  const recommendations = await fetch(base + '/recomendacoes/');
  assert.equal(recommendations.status,200);
  const catalogHtml = await recommendations.text();
  assert.match(catalogHtml,/Ofertas e produtos selecionados/);
  assert.match(catalogHtml,/Links de afiliado/);
  assert.doesNotMatch(catalogHtml,/CPU sintética|example\.org|tag=fixture/);
  const builder=await fetch(base+'/pcs/montar/'); assert.equal(builder.status,200); const builderHtml=await builder.text(); assert.match(builderHtml,/Montador indisponível/); assert.doesNotMatch(builderHtml,/Salvar neste dispositivo|cpu-test|sintético/);
  const pcs=await fetch(base+'/pcs/'); assert.equal(pcs.status,200); const pcHtml=await pcs.text(); assert.match(pcHtml,/Configurações em revisão/); assert.doesNotMatch(pcHtml,/sintético|example\.org/);
  for(const route of ['/celulares/','/celulares/comparar/?modelos=invalido']) {const response=await fetch(base+route);assert.equal(response.status,200);const body=await response.text();assert.match(body,route==='/celulares/'?/Celulares e tablets: compare para o seu uso/:/Buscar modelo/);assert.doesNotMatch(body,/Aparelho sintético|variant-test|example\.org/);}
  for(const route of ['/ferramentas-ti/processadores/','/ferramentas-ti/memoria-ram/']){const response=await fetch(base+route);assert.equal(response.status,200);const body=await response.text();assert.match(body,/Buscar modelo/);assert.doesNotMatch(body,/sintético|fixture-cpu|fixture-ram|example\.org/);}
  const quotes = await fetch(base + '/para-tecnicos/orcamentos/');
  assert.equal(quotes.status, 200);
  const quotesHtml=await quotes.text();
  assert.match(quotesHtml,/Orçamentos de TI/);
  assert.match(quotesHtml,/Nenhum item/);
  assert.doesNotMatch(quotesHtml,/FIXTURE-07|Prestador sintético|Cliente sintético/);
  const help = await fetch(base + '/ajuda/');
  assert.equal(help.status, 200); assert.match(await help.text(), /Guias publicados/);
  assert.deepEqual(await (await fetch(base + '/indice-busca.json')).json(), []);
  assert.doesNotMatch(await (await fetch(base + '/sitemap.xml')).text(), /backup-|article-test|example/);
  assert.match(await (await fetch(base + '/robots.txt')).text(), /Disallow: \//);
  assert.equal((await fetch(base + '/og-blog.png')).status, 200);
  assert.match(html, /role="search"/);
  assert.match(html, /<dialog/);
  assert.match(html, /icon\.svg/);
  assert.equal((await fetch(base + "/icon.svg")).status, 200);
  console.log(
    "Export aprovado: HTML inicial presente, fixtures ausentes, slugs inexistentes/draft com 404.",
  );
} finally {
  server.closeAllConnections();
  server.close();
}
