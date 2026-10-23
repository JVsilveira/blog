import path from "node:path";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename, open } from "node:fs/promises";
import { spawn } from "node:child_process";
import { z } from "zod";
import { withWorkspaceLock } from "./workspace";
import { AdminError } from "./config";
const jobSchema = z.strictObject({
  id: z.string(),
  state: z.enum(["queued", "running", "success", "failed"]),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  message: z.string(),
});
export type BuildJob = z.infer<typeof jobSchema>;
async function writeJob(root: string, job: BuildJob) {
  const target = path.join(root, ".editorial-admin/build.json");
  await writeFile(target + ".tmp", JSON.stringify(job), { mode: 0o600 });
  await rename(target + ".tmp", target);
}
export async function lastBuild(root: string): Promise<BuildJob | null> {
  try {
    return jobSchema.parse(
      JSON.parse(
        await readFile(path.join(root, ".editorial-admin/build.json"), "utf8"),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
export async function queueBuild(root: string) {
  return withWorkspaceLock(root, async () => {
    const prior = await lastBuild(root);
    if (prior && ["queued", "running"].includes(prior.state))
      throw new AdminError("Já existe uma geração em andamento.", 409);
    const job: BuildJob = {
      id: randomUUID(),
      state: "queued",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      message: "Geração agendada. O site público ainda não foi alterado.",
    };
    await writeJob(root, job);
    return job;
  });
}
async function run(root: string, args: string[], logFile: string) {
  const log = await open(logFile, "a", 0o600);
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production" };
  delete env.ICECAT_USERNAME;
  delete env.ICECAT_ENABLED;
  delete env.ICECAT_AUTO_SYNC;
  delete env.ICECAT_API_TOKEN;
  for(const key of ['RETAILER_IMPORT_ENABLED','AMAZON_CREATOR_CLIENT_ID','AMAZON_CREATOR_CLIENT_SECRET','AMAZON_PARTNER_TAG','MERCADOLIVRE_ACCESS_TOKEN'])delete env[key];
  delete env.ICECAT_CONTENT_TOKEN;
  delete env.OPENAI_API_KEY;
  delete env.GEMINI_API_KEY;
  delete env.GOOGLE_API_KEY;
  delete env.EDITORIAL_AI_ENABLED;
  delete env.GOOGLE_CLIENT_ID;
  delete env.GOOGLE_CLIENT_SECRET;
  delete env.EDITORIAL_ADMIN_EMAILS;
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: root,
        stdio: ["ignore", log.fd, log.fd],
        detached: process.platform !== "win32",
        env,
        shell: false,
      });
      let expired = false;
      const timeout = setTimeout(() => {
        expired = true;
        if (process.platform === "win32") child.kill("SIGKILL");
        else {
          try {
            process.kill(-child.pid!, "SIGKILL");
          } catch {
            /* Processo já encerrado. */
          }
        }
      }, 5 * 60_000);
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else
          reject(new Error(expired ? "Tempo excedido." : "Geração recusada."));
      });
    });
  } finally {
    await log.close();
  }
}
export async function executeBuild(root: string, job: BuildJob) {
  let phase = "início";
  const logFile = path.join(
    root,
    ".editorial-admin",
    "build-" + job.id + ".log",
  );
  try {
    await withWorkspaceLock(root, async () => {
      const active = await lastBuild(root);
      if (active?.id !== job.id || active.state !== "queued")
        throw new AdminError("Geração substituída.");
      await writeJob(root, {
        ...job,
        state: "running",
        message: "Validando conteúdo e gerando os arquivos do portal.",
      });
      const loader = path.join(root, "node_modules/tsx/dist/loader.mjs");
      phase = "validação do conteúdo";
      await run(
        root,
        ["--import", loader, path.join(root, "scripts/validate-content.ts")],
        logFile,
      );
      phase = "compilação do portal";
      await run(
        root,
        [
          path.join(root, "node_modules/next/dist/bin/next"),
          "build",
          "--webpack",
        ],
        logFile,
      );
      phase = "finalização do export";
      await run(
        root,
        ["--import", loader, path.join(root, "scripts/finalize-export.ts")],
        logFile,
      );
      await writeJob(root, {
        ...job,
        state: "success",
        finishedAt: new Date().toISOString(),
        message:
          "Versão gerada em out/. A entrega à hospedagem ainda precisa ser realizada.",
      });
    });
  } catch {
    await writeJob(root, {
      ...job,
      state: "failed",
      finishedAt: new Date().toISOString(),
      message: `Falha na etapa de ${phase}. O diagnóstico está no log privado da geração no servidor.`,
    });
  }
}
