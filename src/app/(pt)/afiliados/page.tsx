import {brand} from "../../../config/brand";
import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Afiliados e publicidade", `Política de transparência do ${brand.name} sobre vínculos comerciais, afiliados e publicidade.`, "/afiliados/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Afiliados e publicidade"}
      subtitle={"Transparência antes do clique."}
    >
      <p>
        O SilfonTech utiliza links de afiliado do Mercado Livre nas recomendações identificadas. Podemos receber comissão por compras elegíveis realizadas por esses links, conforme as regras do programa.
      </p>
      <p>
        Os preços e valores de referência são consultados na API da loja e têm validade limitada. Quando houver vários vendedores, o preço apresentado como “a partir de” corresponde aos anúncios consultados. Confirme preço final, vendedor, frete e disponibilidade no Mercado Livre. O desconto informado pela loja não comprova o menor preço histórico.
      </p>
      <p>Comissão não representa avaliação de qualidade. As fichas de produtos e ofertas da loja são distintas das análises editoriais; não indicam teste pessoal. Não há anúncio de comissão ou promessa de economia quando esses dados não estiverem disponíveis.</p>
    </InstitutionalPage>
  );
}
