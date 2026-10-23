import { NextResponse } from "next/server";
import {
  beginGoogleLogin,
  checkOrigin,
  cookieOptions,
  transactionCookie,
} from "../../../lib/auth";
import { config } from "../../../lib/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const login = await beginGoogleLogin();
    const response = NextResponse.redirect(login.url, 303);
    response.cookies.set(
      transactionCookie,
      login.browserToken,
      cookieOptions(600),
    );
    return response;
  } catch {
    let origin: string;
    try {
      origin = config().origin;
    } catch {
      return new NextResponse("Login não configurado no servidor.", {
        status: 503,
      });
    }
    return NextResponse.redirect(origin + "/login?error=login", 303);
  }
}
