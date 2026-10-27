# Orçamento TI com sugestão opcional

Rota: `/para-tecnicos/orcamentos/`.

1. Selecione o porte da cidade, modalidade e categoria; descreva de um a dez serviços.
2. Solicite **Sugerir valores com IA** ou continue manualmente. Cada preço é por uma execução; quantidade é separada. Você pode alterar qualquer valor. Uma nova sugestão substitui os valores anteriores.
3. Preencha prestador, cliente, prazo, validade e pagamento. Ajuste exclusões e condições conforme seu atendimento.
4. Revise e baixe o PDF. O arquivo inclui escopo, itens, totais, condições, premissas da estimativa e campo de aceite; é uma proposta, não uma nota fiscal ou laudo.

Porte: muito pequena até 20 mil; pequena de 20 a 100 mil; média de 100 a 500 mil; grande acima de 500 mil habitantes. São faixas da ferramenta, não classificação oficial do IBGE. Não é necessário informar o nome da cidade à IA. A cidade exata, se preenchida para o PDF, fica local. Não há tabela automática fixa de descontos por população ou pesquisa atual de mercado. Gemini considera a complexidade, modalidade e porte; custos de peças, licenças e deslocamento não são presumidos.

## Privacidade e custo

Uma chamada por clique a Gemini 3.5 Flash-Lite, com store:false, sem ferramentas/grounding, no máximo 1.800 tokens de saída e timeout de 30 s. Payload estrito: citySize, modality, serviceType e services[{id,description}]. Nomes, contatos, endereço, números de série e orçamento completo não entram no request. Descrições têm limite de 160 caracteres e recusam contatos/documentos/credenciais reconhecíveis. Isso não substitui o cuidado de não escrever PII no escopo técnico.

Descrições não são gravadas no banco nem nos logs da aplicação. D1 guarda somente contadores temporários com hash do IP e dia. Plataforma e Google têm suas próprias práticas; o nível gratuito pode usar conteúdo para melhorar produtos. store:false não garante retenção zero pelo provedor. O PDF carrega fonte do mesmo domínio, sem enviar conteúdo do documento.

O projeto da chave deve permanecer no Free, sem faturamento; limites locais não certificam plano da chave nem habilitam cobrança. Nenhum fallback, pesquisa web, retry automático ou upgrade. API limita a 2 pedidos/minuto/IP, 5/dia/IP e 30/dia globais (dia UTC), podendo parar antes por quota Google. Tentativas com erro também consomem contador. Ao atingir o limite, preencher preços manualmente ou aguardar. Endpoint público não é ilimitado; Origin não autentica clientes não navegador.

## Operação

Worker existente `silfontech-admin`, POST `/api/quotes/suggest`, JSON até 16 KiB e CORS somente para PUBLIC_SITE_URL. Sem cookies/credenciais do navegador. QUOTE_AI_ENABLED=true ativa a rota; GEMINI_API_KEY permanece secret do Worker. Desativar a flag suspende chamadas externas, sem bloquear a ferramenta manual. Variável opcional QUOTE_ALLOWED_ORIGINS permite origens adicionais explícitas (somente desenvolvimento controlado). NEXT_PUBLIC_QUOTE_API_URL pode apontar a ferramenta a outro endpoint HTTPS; nunca colocar chaves nessa variável.

jsPDF 4.2.1 carregado somente ao baixar PDF. Noto Sans local com licença em public/fonts/OFL-NotoSans.txt. Cálculo original em centavos/milésimos, arredondamento BigInt por linha. Quote v1 continua aceitando arquivos antigos; citySize/serviceType e pricing são opcionais. pricing guarda modelo, data, sugestões e premissas para rastreabilidade local; alterar escopo ou usar editor avançado invalida essa referência. Não há migração ou upload de documentos salvos.

Editor avançado preserva impressão, JSON, peças, descontos percentuais e snapshots. Salvar fica opcional; não grava em servidor. Arquivos e snapshots emitidos existentes não são modificados silenciosamente. PDFs contêm dados do cliente: devem ser compartilhados pelo profissional com cuidado.

Referências técnicas: [Gemini Free/preços](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite), [Interactions](https://ai.google.dev/api/interactions-api), [jsPDF](https://parallax.github.io/jsPDF/docs/jsPDF.html), [fonte Noto](https://github.com/notofonts/noto-fonts).
