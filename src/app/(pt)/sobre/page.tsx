import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Sobre o Portal Tech", "Conheça a proposta do Portal Tech, projeto de João sobre notícias, opinião e tecnologia.", "/sobre/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Sobre o Portal Tech"}
      subtitle={"Tecnologia prática, com responsabilidade."}
    >
      <p>
        O Portal Tech é um projeto brasileiro de João para ajudar pessoas a
        acompanhar notícias e ler opiniões sobre política, esporte, economia, tecnologia e outros temas.
      </p>
      <p>
        O portal está em preparação. Biografia, qualificações e canais públicos
        do responsável ainda dependem de confirmação. Nenhuma experiência
        pessoal com produtos é presumida.
      </p>
    </InstitutionalPage>
  );
}
