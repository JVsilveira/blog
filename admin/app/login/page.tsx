import {brand} from "../../../src/config/brand";
import { redirect } from "next/navigation";
import { configured } from "../../lib/config";
import { canonicalPage, currentSession } from "../../lib/request";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await canonicalPage("/login");
  if (await currentSession()) redirect("/");
  const ready = configured();
  const error = (await searchParams).error;
  return (
    <main id="conteudo" className="login-page" tabIndex={-1}>
      <div className="login-brand">{brand.name}</div>
      <section className="login-panel">
        <h1>Seu espaço de escrita.</h1>
        <p className="intro">
          Crie guias, revise suas fontes e prepare as próximas publicações.
        </p>
        <form action="/auth/google" method="post">
          <button
            className="button google-button"
            disabled={!ready}
            type="submit"
          >
            Entrar com o Google
          </button>
        </form>
        {!ready && (
          <p className="notice" role="status">
            O login está aguardando configuração no servidor.
          </p>
        )}
        {ready && error && (
          <p className="notice" role="alert">
            Não foi possível entrar. Confira se sua conta está autorizada e
            tente novamente.
          </p>
        )}
        <p className="muted">
          Acesso exclusivo para as contas autorizadas da equipe editorial.
        </p>
      </section>
    </main>
  );
}
