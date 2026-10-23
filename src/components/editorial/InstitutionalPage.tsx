import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, Breadcrumbs } from "../ui";
export function InstitutionalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main id="conteudo" tabIndex={-1} className="document">
      <Breadcrumbs current={title} />
      <h1>{title}</h1>
      <p className="intro">{subtitle}</p>
      <Alert>
        Rascunho institucional. Aguarda revisão de João antes do lançamento.
      </Alert>
      <nav aria-label="Nesta página" className="toc">
        <a href="#conteudo-institucional">Contexto e limites</a>
        <a href="#revisao">Situação da revisão</a>
      </nav>
      <section id="conteudo-institucional">
        <h2>Contexto e limites</h2>
        {children}
      </section>
      <section id="revisao">
        <h2>Situação da revisão</h2>
        <p>
          Texto de implementação, sem aprovação editorial. Atualizado em{" "}
          <time dateTime="2026-10-21">21 de outubro de 2026</time>.
        </p>
        <Link href="/contato/">Disponibilidade de contato</Link>
      </section>
      <a className="back-top" href="#conteudo">
        Voltar ao topo
      </a>
    </main>
  );
}
