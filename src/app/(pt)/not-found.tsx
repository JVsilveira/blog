import Link from "next/link";
export default function NotFound() {
  return (
    <main id="conteudo" tabIndex={-1} className="document">
      <p className="error-code">404</p>
      <h1>Página não encontrada</h1>
      <p>
        Este endereço não está disponível. Volte ao início para consultar os
        caminhos de leitura.
      </p>
      <Link className="button" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}
