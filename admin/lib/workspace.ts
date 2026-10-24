import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { z } from "zod";
import { loadContent } from "../../src/lib/content";
import { operationsSchema, validateEditorial } from "../../src/lib/editorial";
import type {Catalog} from "../../src/domain/schemas";
import {prepareWorkspaceMutation} from "./workspace-mutation";
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
export async function mutateWorkspace(root:string,input:unknown,actor:Pick<Session,'email'>){
 return locked(root,async()=>{
  const {data,operations,changes}=prepareWorkspaceMutation(await readUnlocked(root),input,actor);
  try{await validateEditorial(root,data,operations);}catch(error){if(error instanceof z.ZodError||error instanceof AdminError)throw error;throw new AdminError(error instanceof Error?error.message:'Conteúdo inválido. Confira as referências.');}
  await commit(root,changes);
  return readUnlocked(root);
 });
}

export const withWorkspaceLock = locked;

export const commitWorkspaceFiles=commit;
