import Link from "next/link";
export const institutionalLinks = [
  ["sobre", "Sobre"],
  ["contato", "Contato"],
  ["metodologia", "Política editorial e metodologia"],
  ["afiliados", "Afiliados e publicidade"],
  ["privacidade", "Privacidade"],
  ["termos", "Termos"],
] as const;
export function Footer() {
  return (
    <footer className="site-footer">
      <nav aria-label="Institucional">
        {institutionalLinks.map(([slug, title]) => (
          <Link key={slug} href={`/${slug}/`}>
            {title}
          </Link>
        ))}
      </nav>
      <nav aria-label="Tecnologia e ferramentas">
        <Link href="/ferramentas-ti/">Ferramentas TI</Link><Link href="/celulares/">Celulares</Link><Link href="/pcs/">PCs</Link>
        <Link href="/recomendacoes/">Recomendações</Link><Link href="/ajuda/">Ajuda e guias</Link>
        <Link href="/para-tecnicos/orcamentos/">Para técnicos</Link>
      </nav>
      <p className="footer-note">
        Sem anúncios ou links de afiliados ativos. Conteúdo institucional em
        revisão.
      </p>
    </footer>
  );
}
