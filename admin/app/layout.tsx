import {brand} from "../../src/config/brand";
import type { Metadata } from "next";
import "./admin.css";
export const metadata: Metadata = {
  title: `Área editorial | ${brand.name}`,
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
