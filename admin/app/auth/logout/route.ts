import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkMutation,
  cookieOptions,
  revokeSession,
  sessionCookie,
} from "../../../lib/auth";
import { config, AdminError } from "../../../lib/config";
import { requireSession } from "../../../lib/request";
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    checkMutation(request, session);
    const secret = (await cookies()).get(sessionCookie)?.value;
    if (secret) await revokeSession(secret);
    const response = NextResponse.json({
      redirect: config().origin + "/login",
    });
    response.cookies.set(sessionCookie, "", cookieOptions(0));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Não foi possível encerrar a sessão." },
      { status: error instanceof AdminError ? error.status : 500 },
    );
  }
}
