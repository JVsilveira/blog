import { after, NextResponse } from "next/server";
import { requireSession } from "../../../lib/request";
import { checkMutation } from "../../../lib/auth";
import { config, AdminError } from "../../../lib/config";
import { executeBuild, lastBuild, queueBuild } from "../../../lib/build";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function errorResponse(error: unknown) {
  return json(
    {
      error:
        error instanceof AdminError
          ? error.message
          : "Não foi possível gerar a versão.",
    },
    error instanceof AdminError ? error.status : 500,
  );
}
export async function GET() {
  try {
    await requireSession();
    return json({ job: await lastBuild(config().root) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    checkMutation(request, session);
    const root = config().root;
    const job = await queueBuild(root);
    after(async () => {
      await executeBuild(root, job);
    });
    return json({ job }, 202);
  } catch (error) {
    return errorResponse(error);
  }
}
