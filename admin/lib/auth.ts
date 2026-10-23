import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import {
  OAuth2Client,
  CodeChallengeMethod,
  type TokenPayload,
} from "google-auth-library";
import { z } from "zod";
import { config, AdminError } from "./config";
const SESSION_TTL = 8 * 60 * 60;
export const sessionCookie = "portal_editor_session";
export const transactionCookie = "portal_editor_transaction";
export const token = () => randomBytes(32).toString("base64url");
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function equal(a: string, b: string) {
  const aa = Buffer.from(a),
    bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function isGooglePicture(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      (url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"));
  } catch {
    return false;
  }
}
const sessionSchema = z.strictObject({
  email: z.email(),
  sub: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  picture: z.url().refine(isGooglePicture).optional(),
  csrf: z.string().min(32),
  expires: z.number().int().positive(),
});
export type Session = z.infer<typeof sessionSchema>;
const transactionSchema = z.strictObject({
  verifier: z.string().min(32),
  nonce: z.string().min(32),
  expires: z.number().int().positive(),
});
async function authPath(kind: string, secret: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret))
    throw new AdminError("Sessão inválida.", 401);
  const dir = path.join(config().root, ".editorial-admin", kind);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  return path.join(dir, hash(secret) + ".json");
}
const oauth = () => {
  const cfg = config();
  return new OAuth2Client(
    cfg.clientId,
    cfg.clientSecret,
    cfg.origin + "/auth/callback",
  );
};
export async function beginGoogleLogin() {
  const browserToken = token(),
    nonce = token();
  const client = oauth();
  const verifier = await client.generateCodeVerifierAsync();
  await writeFile(
    await authPath("transactions", browserToken),
    JSON.stringify({
      verifier: verifier.codeVerifier,
      nonce,
      expires: Date.now() + 10 * 60_000,
    }),
    { flag: "wx", mode: 0o600 },
  );
  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state: hash(browserToken),
    code_challenge: verifier.codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    prompt: "select_account",
  });
  const target = new URL(url);
  target.searchParams.set("nonce", nonce);
  return { url: target.href, browserToken };
}
export function authorizeIdentity(
  payload: TokenPayload | undefined,
  nonce: string,
) {
  const cfg = config();
  // verifyIdToken verifica assinatura, issuer, audience e exp antes deste passo.
  if (
    !payload ||
    !payload.sub ||
    payload.email_verified !== true ||
    !payload.email ||
    !payload.nonce ||
    !equal(payload.nonce, nonce) ||
    !cfg.emails.includes(payload.email.toLowerCase())
  )
    throw new AdminError("Conta não autorizada.", 403);
  return {
    email: payload.email.toLowerCase(),
    sub: payload.sub,
    ...(payload.name?.trim() ? { name: payload.name.trim().slice(0, 200) } : {}),
    ...(payload.picture && isGooglePicture(payload.picture) ? { picture: payload.picture } : {}),
  };
}
export async function issueSession(identity: { email: string; sub: string; name?: string; picture?: string }) {
  const secret = token();
  if (!config().emails.includes(identity.email.toLowerCase()))
    throw new AdminError("Conta não autorizada.", 403);
  const session = sessionSchema.parse({
    ...identity,
    csrf: token(),
    expires: Date.now() + SESSION_TTL * 1000,
  });
  await writeFile(await authPath("sessions", secret), JSON.stringify(session), {
    flag: "wx",
    mode: 0o600,
  });
  return secret;
}
export async function finishGoogleLogin(
  browserToken: string,
  state: string,
  code: string,
) {
  if (!equal(hash(browserToken), state))
    throw new AdminError("Login expirado. Tente novamente.", 401);
  const file = await authPath("transactions", browserToken);
  // Claim atômico: apenas uma callback pode consumir esta transação.
  const { rename } = await import("node:fs/promises");
  const claimed = file + ".claimed-" + token();
  await rename(file, claimed);
  let transaction;
  try {
    transaction = transactionSchema.parse(
      JSON.parse(await readFile(claimed, "utf8")),
    );
  } finally {
    await rm(claimed, { force: true });
  }
  if (transaction.expires < Date.now())
    throw new AdminError("Login expirado.", 401);
  const client = oauth();
  const result = await client.getToken({
    code,
    codeVerifier: transaction.verifier,
  });
  if (!result.tokens.id_token)
    throw new AdminError("Identidade não confirmada.", 401);
  const ticket = await client.verifyIdToken({
    idToken: result.tokens.id_token,
    audience: config().clientId,
  });
  return issueSession(
    authorizeIdentity(ticket.getPayload(), transaction.nonce),
  );
}
export async function readSession(secret?: string): Promise<Session | null> {
  if (!secret) return null;
  try {
    const file = await authPath("sessions", secret);
    const session = sessionSchema.parse(
      JSON.parse(await readFile(file, "utf8")),
    );
    if (
      session.expires <= Date.now() ||
      !config().emails.includes(session.email)
    ) {
      await rm(file, { force: true });
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
export async function revokeSession(secret: string) {
  await rm(await authPath("sessions", secret), { force: true });
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== config().origin)
    throw new AdminError("Origem da solicitação recusada.", 403);
}
export function checkMutation(request: Request, session: Session) {
  checkOrigin(request);
  if (!equal(request.headers.get("x-csrf-token") ?? "", session.csrf))
    throw new AdminError("Atualize a página e tente novamente.", 403);
}
export function cookieOptions(maxAge = SESSION_TTL) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config().secure,
    path: "/",
    maxAge,
  };
}
