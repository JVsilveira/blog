import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Política editorial e metodologia", "Critérios editoriais do Portal Tech: fontes, revisão humana, métodos e limites das recomendações.", "/metodologia/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Política editorial e metodologia"}
      subtitle={"Entender o critério faz parte da orientação."}
    >
      <p>
        A proposta editorial é apresentar contexto, fontes, data de revisão e
        limitações. Conteúdos e recomendações precisam de revisão humana antes
        da publicação.
      </p>
      <p>Notícias e textos de opinião são identificados separadamente. Opiniões representam a visão do autor; afirmações factuais precisam de fontes verificáveis. Traduções têm revisão própria e não alteram o posicionamento do original.</p>
      <p>
        Experiência pessoal só poderá ser declarada após confirmação de João.
        Análise documental e configuração editorial deverão ser identificadas
        como tais, sem notas, testes ou benchmarks inventados.
      </p>
    </InstitutionalPage>
  );
}
