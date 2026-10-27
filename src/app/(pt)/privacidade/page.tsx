import {brand} from "../../../config/brand";
import { listingMetadata } from "../../../features/blog/metadata";
import { InstitutionalPage } from "../../../components/editorial/InstitutionalPage";
export const metadata = listingMetadata("Privacidade", `Como funcionam a busca local, os orçamentos no navegador e a privacidade nesta versão do ${brand.name}.`, "/privacidade/");
export default function Page() {
  return (
    <InstitutionalPage
      title={"Privacidade"}
      subtitle={"Dados locais e uso opcional de inteligência artificial."}
    >
      <p>
        Esta versão não possui contas, formulário de contato, analytics ou
        anúncios ativos. A busca funciona no navegador e não envia o texto a um
        serviço de busca.
      </p>
      <p>A preferência de idioma pode ser salva apenas neste navegador. A edição inicial usa os idiomas do navegador, sem consulta de localização por IP e sem enviar essa preferência a terceiros.</p>
      <p>As métricas usam um adaptador sem coleta. Não há cookies de medição, identificadores de visitantes ou envio de eventos a terceiros. O modo de depuração é restrito ao desenvolvimento e rejeita campos fora do contrato; nomes, e-mails, buscas livres, URLs de compra e conteúdo de orçamentos não são aceitos.</p>
      <p>Ao clicar em Sugerir valores com IA, o porte da cidade, a modalidade, o tipo e as descrições técnicas informadas são enviados ao servidor do portal e ao Gemini/Google. Não inclua dados pessoais ou credenciais nas descrições. A análise é opcional; é possível definir os preços manualmente. O serviço não armazena descrições em banco ou logs da aplicação; conserva contadores temporários de uso com hash do IP para limitar solicitações. No nível gratuito do Gemini, o Google pode usar o conteúdo para melhoria dos produtos. Consulte <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">os termos do Gemini</a>.</p>
      <p>Orçamentos ficam em memória até você escolher salvar neste navegador ou exportar JSON/PDF. Nomes, contatos e endereços do cliente não são incluídos nas solicitações de IA. Arquivos exportados contêm dados do cliente; proteja-os. Limpar dados do navegador remove documentos salvos.</p>
      <p>
        A publicação depende da escolha de hospedagem e da revisão de seus
        registros técnicos e práticas de privacidade. Responsável, canal de
        contato e política final ainda precisam ser confirmados. Não há
        declaração de conformidade legal concluída.
      </p>
    </InstitutionalPage>
  );
}
