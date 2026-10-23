import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { CertificateFormat } from "google-auth-library/build/src/auth/oauth2client.js";
import {
  authorizeIdentity,
  beginGoogleLogin,
  checkMutation,
  checkOrigin,
  cookieOptions,
  finishGoogleLogin,
  issueSession,
  readSession,
  revokeSession,
} from "../admin/lib/auth";
import { config, configured } from "../admin/lib/config";
let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "portal-admin-auth-"));
  vi.stubEnv("EDITORIAL_ROOT", root);
  vi.stubEnv("EDITORIAL_ORIGIN", "https://editor.example.org");
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-fixture");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret-fixture");
  vi.stubEnv("EDITORIAL_ADMIN_EMAILS", "editor@example.org");
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});
it("configuração ausente ou origem insegura bloqueiam o login", () => {
  expect(configured()).toBe(true);
  vi.stubEnv("EDITORIAL_ADMIN_EMAILS", "");
  expect(configured()).toBe(false);
  vi.stubEnv("EDITORIAL_ADMIN_EMAILS", "editor@example.org");
  vi.stubEnv("EDITORIAL_ORIGIN", "http://editor.example.org");
  expect(() => config()).toThrow();
  vi.stubEnv("EDITORIAL_ORIGIN", "https://user:password@editor.example.org");
  expect(() => config()).toThrow();
});
it("inicia code flow Google com PKCE S256, nonce, state e sem acesso offline", async () => {
  const login = await beginGoogleLogin();
  const url = new URL(login.url);
  expect(url.origin).toBe("https://accounts.google.com");
  expect(url.searchParams.get("response_type")).toBe("code");
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("nonce")).toBeTruthy();
  expect(url.searchParams.get("state")).toBe(
    createHash("sha256").update(login.browserToken).digest("hex"),
  );
  expect(url.searchParams.get("redirect_uri")).toBe(
    "https://editor.example.org/auth/callback",
  );
  expect(url.searchParams.get("access_type")).not.toBe("offline");
  expect(url.searchParams.get("scope")?.split(" ")).toContain("profile");
});
it("callback exige state e browser token correspondentes antes de trocar o código", async () => {
  const exchange = vi.spyOn(OAuth2Client.prototype, "getToken");
  const login = await beginGoogleLogin();
  await expect(
    finishGoogleLogin(login.browserToken, "wrong", "code"),
  ).rejects.toThrow();
  expect(exchange).not.toHaveBeenCalled();
});
it("identidade exige e-mail verificado, nonce e permissão exata; domínio não concede acesso", () => {
  const payload = {
    sub: "subject",
    aud: "client-fixture",
    iss: "https://accounts.google.com",
    iat: 0,
    exp: 9999999999,
    email: "editor@example.org",
    email_verified: true,
    nonce: "nonce-fixture",
  };
  expect(authorizeIdentity(payload, "nonce-fixture").email).toBe(
    "editor@example.org",
  );
  for (const rejected of [
    { ...payload, email_verified: false },
    { ...payload, email: "other@example.org" },
    { ...payload, nonce: "wrong" },
  ])
    expect(() => authorizeIdentity(rejected, "nonce-fixture")).toThrow();
});
it("sessão não é o token Google: expira, pode ser revogada e revalida a allowlist", async () => {
  const secret = await issueSession({
    email: "editor@example.org",
    sub: "subject-fixture",
  });
  const session = await readSession(secret);
  expect(session?.email).toBe("editor@example.org");
  expect(await readSession(secret + "x")).toBeNull();
  vi.stubEnv("EDITORIAL_ADMIN_EMAILS", "another@example.org");
  expect(await readSession(secret)).toBeNull();
  vi.stubEnv("EDITORIAL_ADMIN_EMAILS", "editor@example.org");
  const other = await issueSession({
    email: "editor@example.org",
    sub: "subject-fixture",
  });
  await revokeSession(other);
  expect(await readSession(other)).toBeNull();
  const expiring = await issueSession({
    email: "editor@example.org",
    sub: "subject-fixture",
  });
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 9 * 60 * 60_000);
  expect(await readSession(expiring)).toBeNull();
});
it("mutações recusam origem cruzada, origem ausente e CSRF inválido; cookie é HttpOnly/Secure", async () => {
  const secret = await issueSession({
    email: "editor@example.org",
    sub: "subject-fixture",
  });
  const session = (await readSession(secret))!;
  expect(() =>
    checkOrigin(new Request("https://editor.example.org/api/workspace")),
  ).toThrow();
  expect(() =>
    checkMutation(
      new Request("https://editor.example.org/api/workspace", {
        headers: {
          origin: "https://evil.example.org",
          "x-csrf-token": session.csrf,
        },
      }),
      session,
    ),
  ).toThrow();
  expect(() =>
    checkMutation(
      new Request("https://editor.example.org/api/workspace", {
        headers: {
          origin: "https://editor.example.org",
          "x-csrf-token": "wrong",
        },
      }),
      session,
    ),
  ).toThrow();
  expect(() =>
    checkMutation(
      new Request("https://editor.example.org/api/workspace", {
        headers: {
          origin: "https://editor.example.org",
          "x-csrf-token": session.csrf,
        },
      }),
      session,
    ),
  ).not.toThrow();
  expect(cookieOptions()).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
});
it("callback nunca cria sessão quando a biblioteca Google recusa a assinatura", async () => {
  const login = await beginGoogleLogin();
  const url = new URL(login.url);
  const transaction = JSON.parse(
    await readFile(
      path.join(
        root,
        ".editorial-admin/transactions",
        url.searchParams.get("state") + ".json",
      ),
      "utf8",
    ),
  );
  // Somente o transporte de troca é simulado; a falha do verificador não é convertida em login.
  vi.spyOn(OAuth2Client.prototype, "getToken").mockImplementation(() =>
    Promise.resolve({
      tokens: { id_token: "invalid-signed-token" },
      res: null,
    }),
  );
  const verification = vi
    .spyOn(OAuth2Client.prototype, "verifyIdToken")
    .mockRejectedValue(new Error("invalid signature"));
  await expect(
    finishGoogleLogin(
      login.browserToken,
      url.searchParams.get("state")!,
      "code",
    ),
  ).rejects.toThrow();
  expect(verification).toHaveBeenCalledWith({
    idToken: "invalid-signed-token",
    audience: "client-fixture",
  });
  expect(transaction.verifier).toBeTruthy();
  await expect(
    finishGoogleLogin(
      login.browserToken,
      url.searchParams.get("state")!,
      "code",
    ),
  ).rejects.toThrow();
});

it("fluxo completo com ID token RSA: valida assinatura/audience/issuer/nonce e consome callback uma vez", async () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  vi.spyOn(
    OAuth2Client.prototype,
    "getFederatedSignonCertsAsync",
  ).mockResolvedValue({
    certs: {
      fixture: String(keys.publicKey.export({ type: "spki", format: "pem" })),
    },
    format: CertificateFormat.PEM,
  });
  const login = await beginGoogleLogin();
  const url = new URL(login.url);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: "subject-fixture",
    aud: "client-fixture",
    iss: "https://accounts.google.com",
    iat: now,
    exp: now + 3600,
    email: "editor@example.org",
    email_verified: true,
    name: "Editor de teste",
    picture: "https://lh3.googleusercontent.com/a/fixture",
    nonce: url.searchParams.get("nonce"),
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const content =
    encode({ alg: "RS256", kid: "fixture" }) + "." + encode(payload);
  const jwt =
    content +
    "." +
    sign("RSA-SHA256", Buffer.from(content), keys.privateKey).toString(
      "base64url",
    );
  vi.spyOn(OAuth2Client.prototype, "getToken").mockImplementation(() =>
    Promise.resolve({ tokens: { id_token: jwt }, res: null }),
  );
  const session = await finishGoogleLogin(
    login.browserToken,
    url.searchParams.get("state")!,
    "single-use-code",
  );
  expect(await readSession(session)).toMatchObject({
    sub: "subject-fixture",
    name: "Editor de teste",
    picture: "https://lh3.googleusercontent.com/a/fixture",
  });
  await expect(
    finishGoogleLogin(
      login.browserToken,
      url.searchParams.get("state")!,
      "single-use-code",
    ),
  ).rejects.toThrow();
  const client = new OAuth2Client("wrong-client");
  await expect(
    client.verifyIdToken({ idToken: jwt, audience: "wrong-client" }),
  ).rejects.toThrow();
});

it("perfil opcional não muda a autorização e descarta imagens fora do Google", async () => {
  const payload = {
    sub: "subject", aud: "client-fixture", iss: "https://accounts.google.com",
    iat: 0, exp: 9999999999, email: "editor@example.org", email_verified: true,
    nonce: "nonce-fixture", name: " Editor de teste ",
    picture: "https://lh3.googleusercontent.com.evil.example/avatar",
  };
  const identity = authorizeIdentity(payload, "nonce-fixture");
  expect(identity.name).toBe("Editor de teste");
  expect(identity).not.toHaveProperty("picture");
  const secret = await issueSession(identity);
  expect((await readSession(secret))?.name).toBe("Editor de teste");
  expect(() => authorizeIdentity({ ...payload, email: "other@example.org" }, "nonce-fixture")).toThrow();
});
