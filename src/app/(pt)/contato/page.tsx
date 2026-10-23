import {brand} from "../../../config/brand";
import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Contato", `Disponibilidade do canal de contato e orientações sobre dados pessoais no ${brand.name}.`, "/contato/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Contato"}
      subtitle={"Canal público ainda não disponível."}
    >
      <p>
        O canal de contato do {brand.name} aguarda definição e autorização de
        João.
      </p>
      <p>
        Não há formulário de envio ou atendimento ativo nesta versão. Não insira
        dados pessoais ou de clientes em buscas.
      </p>
    </InstitutionalPage>
  );
}
