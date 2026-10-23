import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "../../../lib/config";
import {
  cookieOptions,
  finishGoogleLogin,
  sessionCookie,
  transactionCookie,
} from "../../../lib/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
  let cfg;
  try {
    cfg = config();
  } catch {
    return new NextResponse("Login não configurado.", { status: 503 });
  }
  const response = NextResponse.redirect(
    cfg.origin + "/login?error=login",
    303,
  );
  response.cookies.set(transactionCookie, "", cookieOptions(0));
  try {
    const params = new URL(request.url).searchParams;
    const browserToken = (await cookies()).get(transactionCookie)?.value;
    const code = params.get("code"),
      state = params.get("state");
    if (!browserToken || !code || !state || params.has("error"))
      return response;
    const session = await finishGoogleLogin(browserToken, state, code);
    const success = NextResponse.redirect(cfg.origin + "/", 303);
    success.cookies.set(sessionCookie, session, cookieOptions());
    success.cookies.set(transactionCookie, "", cookieOptions(0));
    return success;
  } catch {
    return response;
  }
}
