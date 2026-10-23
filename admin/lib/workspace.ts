import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { z } from "zod";
import { loadContent } from "../../src/lib/content";
import { validateCatalog } from "../../src/lib/catalog";
import { operationsSchema, validateEditorial } from "../../src/lib/editorial";
import {
  articleSchema,
  authorSchema,
  id,
  sourceSchema,
  translationSchema,
  type Catalog,
} from "../../src/domain/schemas";
import { AdminError } from "./config";
import type { Session } from "./auth";
const opsFile = "docs/editorial/controle.json";
const privateDir = ".editorial-admin";
const revisionOf = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
type Operations = z.infer<typeof operationsSchema>;
export type Workspace = {
  data: Catalog;
  operations: Operations;
  revision: string;
};
const articleInput = z.strictObject({
  action: z.literal("article"),
  revision: z.string(),
  slug: id.refine((v) => v !== "sem-publicacao"),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(1000),
  authorId: id,
  category: z.string().trim().min(1).max(100),
  featuredOrder:z.number().int().min(1).max(99999).nullable().optional(),
  kind:z.enum(['blog','news','opinion']).default('blog'),
  translations:z.array(translationSchema.safeExtend({approved:z.boolean().optional()})).max(2).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  sourceIds: z.array(id).max(100),
  relatedProductIds: z.array(id).max(100),
  methodology: z.string().trim().min(1).max(5000),
  limitations: z.string().trim().min(1).max(5000),
  body: z.string().trim().min(1).max(200_000),
  status: z.enum(["draft", "published", "archived"]),
  approved: z.boolean(),
  creating: z.boolean(),
});
const mutationSchema = z.discriminatedUnion("action", [
  articleInput,
  z.strictObject({
    action: z.literal("author"),
    revision: z.string(),
    id,
    name: z.string().trim().min(1).max(200),
    approved: z.boolean(),
    creating: z.boolean(),
  }),
  z.strictObject({
    action: z.literal("source"),
    revision: z.string(),
    id,
    url: z.string().max(2000),
    publisher: z.string().trim().min(1).max(300),
    accessedAt: z.string(),
    scope: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
    note: z.string().max(5000),
    approved: z.boolean(),
    creating: z.boolean(),
  }),
]);
const journalSchema = z.array(
  z.strictObject({ file: z.string(), before: z.string().nullable() }),
);
const writable = (file: string) =>
  file === "src/data/hardware.json" ||
  file === opsFile ||
  file === "src/data/catalog.json" ||
  /^src\/content\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/(article.json|body.md)$/.test(
    file,
  );
async function atomic(file: string, contents: string) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = file + ".tmp-" + process.pid;
  await writeFile(temp, contents, { mode: 0o600 });
  await rename(temp, file);
}
async function rollback(root: string) {
  const journal = path.join(root, privateDir, "transaction.json");
  let raw: string;
  try {
    raw = await readFile(journal, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  const entries = journalSchema.parse(JSON.parse(raw));
  if (entries.some((entry) => !writable(entry.file)))
    throw new AdminError(
      "Diário de recuperação inválido. Revisão técnica necessária.",
      503,
    );
  for (const entry of entries) {
    const file = path.join(root, entry.file);
    if (entry.before === null) await rm(file, { force: true });
    else await atomic(file, entry.before);
  }
  // Uma criação interrompida não pode deixar pasta de artigo vazia no loader.
  for (const entry of entries.filter(
    (entry) => entry.file.endsWith("/article.json") && entry.before === null,
  ))
    await rm(path.dirname(path.join(root, entry.file)), {
      recursive: true,
      force: true,
    });
  await rm(journal);
}
async function locked<T>(root: string, work: () => Promise<T>) {
  const directory = path.join(root, privateDir);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const lock = path.join(directory, "lock");
  try {
    await mkdir(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new AdminError(
        "Outra operação está em andamento. Aguarde e tente novamente.",
        409,
      );
    throw error;
  }
  try {
    await writeFile(path.join(lock, "pid"), String(process.pid));
    await rollback(root);
    return await work();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}
async function readUnlocked(root: string): Promise<Workspace> {
  const data = await loadContent(root);
  const operations = operationsSchema.parse(
    JSON.parse(await readFile(path.join(root, opsFile), "utf8")),
  );
  return { data, operations, revision: revisionOf({ data, operations }) };
}
export async function readWorkspace(root: string) {
  return locked(root, () => readUnlocked(root));
}
async function commit(
  root: string,
  changes: { file: string; contents: string }[],
) {
  const entries = [];
  for (const change of changes) {
    if (!writable(change.file))
      throw new AdminError("Destino de escrita recusado.");
    let before = null;
    try {
      before = await readFile(path.join(root, change.file), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    entries.push({ file: change.file, before });
  }
  const backupDir = path.join(root, privateDir, "backups");
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const journal = JSON.stringify(entries);
  await writeFile(
    path.join(
      backupDir,
      Date.now() + "-" + revisionOf(journal).slice(0, 16) + ".json",
    ),
    journal,
    { flag: "wx", mode: 0o600 },
  );
  await atomic(path.join(root, privateDir, "transaction.json"), journal);
  try {
    for (const change of changes)
      await atomic(path.join(root, change.file), change.contents);
    await rm(path.join(root, privateDir, "transaction.json"));
  } catch (error) {
    await rollback(root);
    throw error;
  }
}
export async function mutateWorkspace(
  root: string,
  input: unknown,
  actor: Pick<Session, "email">,
) {
  const mutation = mutationSchema.parse(input);
  return locked(root, async () => {
    const workspace = await readUnlocked(root);
    if (mutation.revision !== workspace.revision)
      throw new AdminError(
        "O conteúdo mudou em outra aba. Recarregue a lista antes de salvar.",
        409,
      );
    const { data, operations } = workspace;
    const date = new Date().toISOString();
    const changes: { file: string; contents: string }[] = [];
    const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
    if (mutation.action === "article") {
      const existing = data.articles.find((a) => a.slug === mutation.slug);
      checkMode(mutation.creating, !!existing);
      if (mutation.status === "published" && !mutation.approved)
        throw new AdminError(
          "Confirme a revisão editorial antes de aprovar para publicação.",
        );
      const article = articleSchema.parse({
        schemaVersion: 1,
        id: existing?.id ?? mutation.slug,
        slug: mutation.slug,
        createdAt: existing?.createdAt ?? date,
        updatedAt: date,
        status: mutation.status,
        title: mutation.title,
        description: mutation.description,
        authorId: mutation.authorId,
        category: mutation.category,
        kind:mutation.kind,
        featuredOrder:mutation.featuredOrder === undefined ? existing?.featuredOrder ?? null : mutation.featuredOrder,
        translations:(mutation.translations ?? existing?.translations ?? []).map(t => {
          const approved='approved' in t && t.approved===true;
          const sourceKeys=['title','description','category','kind','authorId','body','methodology','limitations','tags','sourceIds'] as const;
          const unchanged=!!existing && sourceKeys.every(key => JSON.stringify(key==='kind' ? existing.kind ?? 'blog' : existing[key])===JSON.stringify(mutation[key]));
          const prior=existing?.translations?.find(p=>p.language===t.language);
          const same=!!prior && ['title','description','body','methodology','limitations'].every(key=>prior[key as keyof typeof prior]===t[key as keyof typeof t]);
          const retained=t.status==='published' && unchanged && same && !!prior?.reviewedAt && prior.sourceUpdatedAt===existing?.updatedAt;
          return {language:t.language,title:t.title,description:t.description,body:t.body,methodology:t.methodology,limitations:t.limitations,
            status:approved || retained ? 'published':'draft', reviewedAt:approved ? date:retained ? prior!.reviewedAt:null,
            sourceUpdatedAt:approved || retained ? date:null};
        }),
        tags: mutation.tags,
        sourceIds: mutation.sourceIds,
        relatedProductIds: mutation.relatedProductIds,
        methodology: mutation.methodology,
        limitations: mutation.limitations,
        body: mutation.body,
        publishedAt:
          mutation.status === "published"
            ? (existing?.publishedAt ?? date)
            : (existing?.publishedAt ?? null),
        ownerApprovedAt: mutation.status === "published" ? date : null,
      });
      data.articles = [
        ...data.articles.filter((a) => a.slug !== mutation.slug),
        article,
      ];
      const prior = operations.records.find(
        (r) => r.kind === "article" && r.id === article.id,
      );
      operations.records = [
        ...operations.records.filter(
          (r) => !(r.kind === "article" && r.id === article.id),
        ),
        {
          kind: "article",
          id: article.id,
          owner: prior?.owner ?? actor.email,
          reviewer: mutation.status === "published" ? actor.email : null,
          nextReviewAt: prior?.nextReviewAt ?? null,
          note:
            mutation.status === "published"
              ? "Revisão confirmada pelo administrador autenticado. Aguardando build e entrega ao site."
              : "Conteúdo salvo pelo painel editorial.",
        },
      ];
      const { body, ...metadata } = article;
      changes.push(
        {
          file: `src/content/articles/${article.slug}/article.json`,
          contents: json(metadata),
        },
        {
          file: `src/content/articles/${article.slug}/body.md`,
          contents: body + "\n",
        },
        { file: opsFile, contents: json(operations) },
      );
    } else {
      if (mutation.action === "author") {
        const existing = data.authors.find((a) => a.id === mutation.id);
        checkMode(mutation.creating, !!existing);
        const author = authorSchema.parse({
          schemaVersion: 1,
          id: mutation.id,
          name: mutation.name,
          createdAt: existing?.createdAt ?? date,
          updatedAt: date,
          status: mutation.approved ? "published" : "draft",
          ownerApprovedAt: mutation.approved ? date : null,
        });
        data.authors = [
          ...data.authors.filter((a) => a.id !== mutation.id),
          author,
        ];
      } else {
        const existing = data.sources.find((s) => s.id === mutation.id);
        checkMode(mutation.creating, !!existing);
        const source = sourceSchema.parse({
          schemaVersion: 1,
          id: mutation.id,
          url: mutation.url,
          publisher: mutation.publisher,
          accessedAt: mutation.accessedAt,
          scope: mutation.scope,
          ...(mutation.note.trim() ? { note: mutation.note.trim() } : {}),
          createdAt: existing?.createdAt ?? date,
          updatedAt: date,
          status: mutation.approved ? "published" : "draft",
        });
        data.sources = [
          ...data.sources.filter((s) => s.id !== mutation.id),
          source,
        ];
      }
      const { articles: _articles, ...catalog } = data;
      void _articles;
      changes.push({ file: "src/data/catalog.json", contents: json(catalog) });
    }
    try {
      const validated = validateCatalog(data);
      await validateEditorial(root, validated, operations);
    } catch (error) {
      if (error instanceof z.ZodError) throw error;
      throw new AdminError(
        error instanceof Error
          ? error.message
          : "Conteúdo inválido. Confira as referências.",
      );
    }
    await commit(root, changes);
    return readUnlocked(root);
  });
}

export const withWorkspaceLock = locked;

function checkMode(creating: boolean, exists: boolean) {
  if (creating && exists)
    throw new AdminError(
      "Este identificador já existe. Abra o registro pela lista para editar.",
      409,
    );
  if (!creating && !exists)
    throw new AdminError("Registro não encontrado. Recarregue a lista.", 404);
}

export const commitWorkspaceFiles=commit;
