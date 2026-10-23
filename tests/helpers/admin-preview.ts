// Harness exclusivamente local: cria dados e sessão sintéticos fora do portal real.
import {
  cp,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fixture } from "../fixtures/catalog";
import { issueSession } from "../../admin/lib/auth";
const qaPort=Number(process.argv.find(value=>value.startsWith("--port="))?.split("=")[1]??4180);
if(!Number.isInteger(qaPort)||qaPort<1024||qaPort>65535)throw new Error("Porta de QA inválida.");
const reuse = process.argv.includes("--reuse");
const root = reuse
  ? await readFile("/tmp/portal-editorial-qa-root", "utf8")
  : await mkdtemp(path.join(tmpdir(), "portal-editorial-preview-"));
if (!path.basename(root).startsWith("portal-editorial-preview-"))
  throw new Error("Somente diretório sintético de QA.");
const project = process.cwd();
if (!reuse) {
  for (const file of [
    "src",
    "public",
    "scripts",
    "templates",
    "next.config.ts",
    "tsconfig.json",
    "next-env.d.ts",
    "package.json",
  ])
    await cp(path.join(project, file), path.join(root, file), {
      recursive: true,
    });
  await symlink(
    path.join(project, "node_modules"),
    path.join(root, "node_modules"),
    "dir",
  );
  await cp(
    path.join(project, "tests/fixtures"),
    path.join(root, "tests/fixtures"),
    { recursive: true },
  );
  await mkdir(path.join(root, "docs/editorial"), { recursive: true });
  await rm(path.join(root, "src/content/articles"), { recursive: true });
  await mkdir(path.join(root, "src/content/articles/article-test"), {
    recursive: true,
  });
  const data = fixture();
  data.products = [];
  data.offers = [];
  data.reviews = [];
  const article = {
    ...data.articles[0]!,
    status: "draft",
    ownerApprovedAt: null,
    publishedAt: null,
    relatedProductIds: [],
  };
  const { body, ...metadata } = article;
  await writeFile(
    path.join(root, "src/content/articles/article-test/article.json"),
    JSON.stringify(metadata),
  );
  await writeFile(
    path.join(root, "src/content/articles/article-test/body.md"),
    body,
  );
  const { articles: _articles, ...catalog } = data;
  void _articles;
  await writeFile(
    path.join(root, "src/data/catalog.json"),
    JSON.stringify(catalog),
  );
  await writeFile(
    path.join(root, "docs/editorial/controle.json"),
    JSON.stringify({
      schemaVersion: 1,
      records: [
        {
          kind: "article",
          id: "article-test",
          owner: "Responsável sintético",
          reviewer: null,
          nextReviewAt: null,
          note: "Fixture de QA",
        },
      ],
    }),
  );
}
if(process.argv.includes("--hardware-ui"))await cp(path.join(project,"admin/lib"),path.join(root,"admin/lib"),{recursive:true});
if(process.argv.includes("--hardware-ui"))await writeFile(path.join(root,"src/data/hardware.json"),JSON.stringify({schemaVersion:1,items:[]}));
Object.assign(process.env, {
  ICECAT_AUTO_SYNC:"false",
  EDITORIAL_QA_DEVICES:process.argv.includes("--devices-ui")?"true":"false",
  ICECAT_ENABLED:process.argv.includes("--hardware-ui")?"true":"false",
  ICECAT_API_TOKEN:process.argv.includes("--hardware-ui")?"private-fixture-api-token":"",
  EDITORIAL_ROOT: root,
  EDITORIAL_ORIGIN: `http://127.0.0.1:${qaPort}`,
  EDITORIAL_ADMIN_EMAILS: "editor@example.org",
  GOOGLE_CLIENT_ID: "fixture-client",
  GOOGLE_CLIENT_SECRET: "fixture-secret",
  // Somente para teste de UI com /api/title interceptado pelo navegador.
  EDITORIAL_AI_ENABLED: process.argv.includes("--title-ui") ? "true" : "false",
  GEMINI_API_KEY: process.argv.includes("--title-ui") ? "fixture-api-key-not-real" : "",
});
const secret = await issueSession({
  email: "editor@example.org",
  sub: "fixture-subject",
  name: "Editor de teste",
  picture: "https://lh3.googleusercontent.com/a/fixture",
});
await writeFile(
  "/tmp/portal-editorial-qa-state.json",
  JSON.stringify({
    cookies: [
      {
        name: "portal_editor_session",
        value: secret,
        domain: "127.0.0.1",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 3600,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [],
  }),
  { mode: 0o600 },
);
await writeFile("/tmp/portal-editorial-qa-root", root, { mode: 0o600 });
console.log(
  `Preview isolado da área editorial: http://127.0.0.1:${qaPort} (nenhum login Google real simulado).`,
);
const child = spawn(
  process.execPath,
  [
    ...(process.argv.includes("--hardware-ui")?["--import","tsx","--import",path.join(project,"tests/helpers/icecat-preview-fetch.ts")]:[]),
    path.join(project, "node_modules/next/dist/bin/next"),
    "start",
    path.join(project, "admin"),
    "--hostname",
    "127.0.0.1",
    "--port",
    String(qaPort),
  ],
  { env: process.env, stdio: "inherit" },
);
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
