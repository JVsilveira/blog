import {brand} from "../../../config/brand";
import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata(`Sobre o ${brand.name}`, `Conheça a proposta do ${brand.name}, projeto de João sobre notícias, opinião e tecnologia.`, "/sobre/");
export default function Page() {
  return (
    <InstitutionalPage
      title={`Sobre o ${brand.name}`}
      subtitle={"Tecnologia prática, com responsabilidade."}
    >
      <p>
        O {brand.name} é um projeto brasileiro de João para ajudar pessoas a
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
