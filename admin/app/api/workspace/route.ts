import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, limitedJSON } from "../../../lib/request";
import { checkMutation } from "../../../lib/auth";
import { config, AdminError } from "../../../lib/config";
import { mutateWorkspace, readWorkspace } from "../../../lib/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function failure(error: unknown) {
  if (error instanceof AdminError)
    return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      {
        error: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      },
      400,
    );
  return json(
    {
      error:
        "Não foi possível acessar os arquivos editoriais. Confira a configuração e tente novamente.",
    },
    500,
  );
}
export async function GET() {
  try {
    await requireSession();
    return json(await readWorkspace(config().root));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    checkMutation(request, session);
    return json(
      await mutateWorkspace(config().root, await limitedJSON(request), session),
    );
  } catch (error) {
    return failure(error);
  }
}
