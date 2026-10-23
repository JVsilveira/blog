import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fixture } from "./fixtures/catalog";
import { mutateWorkspace, readWorkspace } from "../admin/lib/workspace";
let root: string;
const actor = { email: "editor@example.org" };
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "portal-admin-store-"));
  for (const dir of [
    "src/data",
    "src/content/articles",
    "src/app/ajuda",
    "docs/editorial",
  ])
    await mkdir(path.join(root, dir), { recursive: true });
  const { articles: _articles, ...catalog } = fixture();
  void _articles;
  catalog.products = [];
  catalog.offers = [];
  catalog.reviews = [];
  await writeFile(
    path.join(root, "src/data/catalog.json"),
    JSON.stringify(catalog),
  );
  await writeFile(
    path.join(root, "docs/editorial/controle.json"),
    JSON.stringify({ schemaVersion: 1, records: [] }),
  );
  await writeFile(path.join(root, "src/app/ajuda/page.tsx"), "");
  await writeFile(
    path.join(root, "src/data/phones.json"),
    JSON.stringify({ variants: [] }),
  );
  await writeFile(
    path.join(root, "src/data/pc-configurations.json"),
    JSON.stringify({ configurations: [] }),
  );
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
async function article(overrides: object = {}) {
  const current = await readWorkspace(root);
  return {
    action: "article",
    revision: current.revision,
    slug: "new-guide",
    title: "Guia de teste",
    description: "Resumo de teste",
    authorId: "author-test",
    category: "Teste",
    tags: [],
    sourceIds: ["source-test"],
    relatedProductIds: [],
    methodology: "Análise sintética de teste",
    limitations: "Fixture não publicável",
    body: "## Contexto\n\nConteúdo de teste.",
    status: "draft",
    approved: false,
    creating: !current.data.articles.some((a) => a.slug === "new-guide"),
    ...overrides,
  };
}
it("cria, reabre e edita artigo sem perder o original; revisor só é atribuído após aprovação explícita", async () => {
  const draft = await mutateWorkspace(root, await article(), actor);
  expect(draft.data.articles[0]?.status).toBe("draft");
  expect(draft.operations.records[0]?.reviewer).toBeNull();
  const published = await mutateWorkspace(
    root,
    await article({
      status: "published",
      approved: true,
      title: "Guia revisado",
    }),
    actor,
  );
  expect(published.data.articles[0]?.ownerApprovedAt).toBeTruthy();
  expect(published.operations.records[0]?.reviewer).toBe(actor.email);
  const saved = JSON.parse(
    await readFile(
      path.join(root, "src/content/articles/new-guide/article.json"),
      "utf8",
    ),
  );
  expect(saved.body).toBeUndefined();
  expect(saved.title).toBe("Guia revisado");
  expect(
    await readFile(
      path.join(root, "src/content/articles/new-guide/body.md"),
      "utf8",
    ),
  ).toContain("Conteúdo de teste.");
});
it("não salva conteúdo aprovado sem confirmação ou com fonte/autor ainda draft", async () => {
  await expect(
    mutateWorkspace(root, await article({ status: "published" }), actor),
  ).rejects.toThrow("Confirme");
  const state = await readWorkspace(root);
  await mutateWorkspace(
    root,
    {
      action: "author",
      creating: false,
      revision: state.revision,
      id: "author-test",
      name: "Autor sintético",
      approved: false,
    },
    actor,
  );
  await expect(
    mutateWorkspace(
      root,
      await article({ status: "published", approved: true }),
      actor,
    ),
  ).rejects.toThrow();
  expect((await readWorkspace(root)).data.articles).toHaveLength(0);
});
it("recusa escrita concorrente e dados com versão antiga sem sobrescrever mudanças", async () => {
  const input = await article();
  await mutateWorkspace(root, input, actor);
  await expect(
    mutateWorkspace(root, { ...input, title: "Sobrescrita" }, actor),
  ).rejects.toThrow("outra aba");
  await mkdir(path.join(root, ".editorial-admin/lock"));
  await expect(readWorkspace(root)).rejects.toThrow("Outra operação");
});
it("recusa traversal, link local quebrado, imagem sem direitos e URL insegura", async () => {
  await expect(
    mutateWorkspace(root, await article({ slug: "../escape" }), actor),
  ).rejects.toThrow();
  for (const body of [
    "[link](/ausente/)",
    "![imagem](https://example.org/image.png)",
    "[link](javascript:alert)",
  ])
    await expect(
      mutateWorkspace(root, await article({ body }), actor),
    ).rejects.toThrow();
  expect((await readWorkspace(root)).data.articles).toHaveLength(0);
});
it("aprova fonte e autoria separadamente e preserva dados de outros módulos", async () => {
  const original = (await readWorkspace(root)).data.sources[0]!;
  let workspace = await mutateWorkspace(
    root,
    {
      action: "author",
      creating: true,
      revision: (await readWorkspace(root)).revision,
      id: "new-author",
      name: "Novo autor de teste",
      approved: true,
    },
    actor,
  );
  workspace = await mutateWorkspace(
    root,
    {
      action: "source",
      creating: true,
      revision: workspace.revision,
      id: "new-source",
      url: "https://example.org/source",
      publisher: "Fonte sintética",
      accessedAt: new Date().toISOString(),
      scope: ["Campo sintético"],
      note: "",
      approved: true,
    },
    actor,
  );
  expect(workspace.data.sources.find((s) => s.id === original.id)).toEqual(
    original,
  );
  expect(
    workspace.data.authors.find((a) => a.id === "new-author")?.status,
  ).toBe("published");
  expect(
    workspace.data.sources.find((s) => s.id === "new-source")?.status,
  ).toBe("published");
});
it("recupera uma transação interrompida antes de devolver o próximo estado", async () => {
  await mutateWorkspace(root, await article(), actor);
  const file = "src/content/articles/new-guide/body.md";
  const before = await readFile(path.join(root, file), "utf8");
  await writeFile(path.join(root, file), "escrita interrompida");
  await writeFile(
    path.join(root, ".editorial-admin/transaction.json"),
    JSON.stringify([{ file, before }]),
  );
  expect((await readWorkspace(root)).data.articles[0]?.body).toBe(
    before.trim(),
  );
  expect(await readFile(path.join(root, file), "utf8")).toBe(before);
});

it("fila de geração recusa duplicação e comunica falha sem perder o conteúdo", async () => {
  const { queueBuild, executeBuild, lastBuild } =
    await import("../admin/lib/build");
  const before = await readWorkspace(root);
  const job = await queueBuild(root);
  await expect(queueBuild(root)).rejects.toThrow("andamento");
  // Diretório sintético não contém scripts/dependências: deve falhar com diagnóstico público seguro.
  await executeBuild(root, job);
  expect((await lastBuild(root))?.state).toBe("failed");
  expect((await readWorkspace(root)).revision).toBe(before.revision);
  expect((await queueBuild(root)).state).toBe("queued");
});

it("criar com slug existente não sobrescreve uma postagem", async () => {
  await mutateWorkspace(root, await article(), actor);
  await expect(
    mutateWorkspace(
      root,
      await article({ creating: true, title: "Outra postagem" }),
      actor,
    ),
  ).rejects.toThrow("já existe");
  expect((await readWorkspace(root)).data.articles[0]?.title).toBe(
    "Guia de teste",
  );
});

it('aprova traduções separadamente, preserva revisão em edição só da tradução e invalida ao alterar o original',async()=>{
  const translation={language:'en',status:'draft',title:'Synthetic translated headline',description:'Synthetic translated summary',body:'Synthetic translated body, not real news.',methodology:'Synthetic methodology',limitations:'Synthetic limitations',reviewedAt:null,sourceUpdatedAt:null,approved:true};
  let saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Política',translations:[translation]}),actor);
  let item=saved.data.articles[0]!;
  expect(item.kind).toBe('opinion');expect(item.translations![0]!.status).toBe('published');
  expect(item.translations![0]!.sourceUpdatedAt).toBe(item.updatedAt);
  saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Política',translations:[{...item.translations![0],approved:false}]}),actor);
  expect(saved.data.articles[0]!.translations![0]!.status).toBe('published');
  item=saved.data.articles[0]!;
  saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Política',body:'Texto original alterado: a tradução precisa de revisão.',translations:[{...item.translations![0],approved:false}]}),actor);
  expect(saved.data.articles[0]!.translations![0]!.status).toBe('draft');
  expect(saved.data.articles[0]!.translations![0]!.reviewedAt).toBeNull();
});

it('persiste e remove ordem de destaque, preserva valor em clientes antigos e recusa ordens inválidas',async()=>{
 let saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Economia',featuredOrder:2}),actor);
 expect(saved.data.articles[0]).toMatchObject({kind:'opinion',category:'Economia',featuredOrder:2});
 saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Economia'}),actor);
 expect(saved.data.articles[0]!.featuredOrder).toBe(2);
 for(const featuredOrder of [0,-1,1.5,100000])await expect(mutateWorkspace(root,await article({featuredOrder}),actor)).rejects.toThrow();
 saved=await mutateWorkspace(root,await article({kind:'opinion',category:'Economia',featuredOrder:null}),actor);
 expect(saved.data.articles[0]!.featuredOrder).toBeNull();
});
