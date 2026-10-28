import Link from "next/link";
import { listingMetadata } from "../../../features/blog/metadata";

export const metadata = listingMetadata(
  "Ferramentas TI",
  "Orçamentos de serviços e comparação de celulares, tablets, processadores e memória RAM.",
  "/ferramentas-ti/",
);

const tools = [
  {
    href: "/para-tecnicos/orcamentos/",
    title: "Orçamento de TI",
    description: "Monte o orçamento dos seus serviços.",
    kind: "budget",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M14 6h16l8 8v28H14z" />
        <path d="M30 6v9h8M20 23h12M20 30h12M20 37h8" />
      </svg>
    ),
  },
  {
    href: "/celulares/comparar/",
    title: "Comparador de celulares e tablets",
    description: "Confira variantes, especificações e custo-benefício.",
    kind: "phones",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="7" width="19" height="34" rx="3" />
        <rect x="30" y="12" width="11" height="29" rx="2" />
        <path d="M15 12h6M15 36h5M33 17h5M34 36h3" />
      </svg>
    ),
  },
  {
    href: "/ferramentas-ti/processadores/",
    title: "Comparador de processadores",
    description:
      "Compare fichas técnicas, benchmarks equivalentes e o preço encontrado.",
    kind: "cpu",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="12" y="12" width="24" height="24" rx="3" />
        <rect x="18" y="18" width="12" height="12" rx="1" />
        <path d="M17 6v6M24 6v6M31 6v6M17 36v6M24 36v6M31 36v6M6 17h6M6 24h6M6 31h6M36 17h6M36 24h6M36 31h6" />
      </svg>
    ),
  },
  {
    href: "/ferramentas-ti/memoria-ram/",
    title: "Comparador de memória RAM",
    description:
      "Compare kits, especificações e desempenho medido na mesma plataforma.",
    kind: "ram",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 14h36v20H6z" />
        <path d="M12 19h6v9h-6zM22 19h6v9h-6zM32 19h5v9h-5zM11 34v5M17 34v5M23 34v5M29 34v5M35 34v5M9 10v4M39 10v4" />
      </svg>
    ),
  },
] as const;

export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1} className="tools-page">
      <header className="tools-heading">
        <h1>Ferramentas TI</h1>
      </header>
      <div className="tool-directory">
        {tools.map((tool) => (
          <Link
            className={`tool-card tool-card--${tool.kind}`}
            href={tool.href}
            key={tool.href}
          >
            <span className="tool-card-icon">{tool.icon}</span>
            <span className="tool-card-copy">
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </span>
            <span className="tool-card-open" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
