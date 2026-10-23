import { cookies, headers } from "next/headers";
import { readSession, sessionCookie } from "./auth";
import { AdminError, configured, config } from "./config";
import { redirect } from "next/navigation";
export async function currentSession() {
  return readSession((await cookies()).get(sessionCookie)?.value);
}
export async function requireSession() {
  const session = await currentSession();
  if (!session) throw new AdminError("Entre novamente para continuar.", 401);
  return session;
}
export async function limitedJSON(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AdminError("Envie JSON.", 415);
  if (!request.body) throw new AdminError("Solicitação vazia.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > 512 * 1024) {
      await reader.cancel();
      throw new AdminError("Conteúdo maior que 512 KB.", 413);
    }
    chunks.push(result.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new AdminError("JSON inválido.");
  }
}

export async function canonicalPage(pathname: "/" | "/login") {
  if (!configured()) return;
  const origin = config().origin;
  if ((await headers()).get("host") !== new URL(origin).host)
    redirect(origin + pathname);
}
