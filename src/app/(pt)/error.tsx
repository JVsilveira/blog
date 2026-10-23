"use client";
import Link from "next/link";
import { Alert, Button } from "../../components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" tabIndex={-1} className="document">
      <h1>Não foi possível exibir esta página</h1>
      <Alert urgent>
        Ocorreu uma falha na interface. Tente novamente ou volte ao início.
      </Alert>
      <Button onClick={reset}>Tentar novamente</Button>
      <p>
        <Link href="/">Voltar ao início</Link>
      </p>
    </main>
  );
}
