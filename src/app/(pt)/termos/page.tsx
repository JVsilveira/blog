import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Termos de uso", "Condições e limitações das orientações e ferramentas do Portal Tech.", "/termos/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Termos de uso"}
      subtitle={"Orientação com contexto e limites."}
    >
      <p>
        O Portal Tech está em preparação e não realiza vendas ou recebe
        pagamentos. A ferramenta de orçamentos funciona localmente: os valores e
        condições são informados pelo profissional, sem envio ao portal. Não há
        atendimento ativo nesta versão.
      </p>
      <p>
        Os termos definitivos dependem de revisão humana, identificação do
        responsável e definição do contato público. Esta página não substitui a
        avaliação desses requisitos antes do lançamento.
      </p>
    </InstitutionalPage>
  );
}
