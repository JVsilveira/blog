import path from "node:path";
import { z } from "zod";
export class AdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function config() {
  const origin = new URL(process.env.EDITORIAL_ORIGIN ?? "");
  if (
    origin.origin !== origin.href.replace(/\/$/, "") ||
    origin.username ||
    origin.password ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname)
      ))
  )
    throw new AdminError("Origem editorial inválida.", 503);
  const emails = (process.env.EDITORIAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (
    !emails.length ||
    emails.some((email) => !z.email().safeParse(email).success)
  )
    throw new AdminError("Configure os e-mails autorizados.", 503);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const root = process.env.EDITORIAL_ROOT;
  if (!clientId || !clientSecret || !root || !path.isAbsolute(root))
    throw new AdminError("Configuração do servidor pendente.", 503);
  return {
    origin: origin.origin,
    secure: origin.protocol === "https:",
    emails,
    clientId,
    clientSecret,
    root: path.resolve(root),
  };
}
export function configured() {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}
