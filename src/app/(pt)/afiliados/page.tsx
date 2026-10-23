import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Afiliados e publicidade", "Política de transparência do Portal Tech sobre vínculos comerciais, afiliados e publicidade.", "/afiliados/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Afiliados e publicidade"}
      subtitle={"Transparência antes do clique."}
    >
      <p>
        Não há links de afiliados ou anúncios ativos nesta versão. Afiliados são
        uma hipótese futura de monetização, sem promessa de receita.
      </p>
      <p>
        Se houver ativação, os vínculos comerciais deverão ser informados perto
        das recomendações e os links identificados. Preços, ofertas e
        disponibilidade não serão presumidos.
      </p>
    </InstitutionalPage>
  );
}
