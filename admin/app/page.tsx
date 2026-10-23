import { redirect } from "next/navigation";
import { canonicalPage, currentSession } from "../lib/request";
import { readWorkspace } from "../lib/workspace";
import { config } from "../lib/config";
import { titleAIStatus } from "../lib/title-ai";
import { Dashboard } from "../components/Dashboard";
export const dynamic = "force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{mercadolivre?:string}>}) {
  await canonicalPage("/");
  const session = await currentSession();
  if (!session) redirect("/login");
  let initial = null;
  try {
    initial = await readWorkspace(config().root);
  } catch {
    /* Falha recuperável pela ação Recarregar. */
  }
  const result=(await searchParams).mercadolivre;
  return (
    <Dashboard
      initialTab={result==='connected'||result==='error'?'hardware':'articles'}
      mercadoFeedback={result==='connected'||result==='error'?result:undefined}
      email={session.email}
      name={session.name}
      picture={session.picture}
      csrf={session.csrf}
      initial={initial}
      titleAI={titleAIStatus()}
    />
  );
}
