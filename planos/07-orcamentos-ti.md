# 07 — Gerador local de orçamentos para atendimento de TI

## Resultado e dependências
Depende de 02 e domínio de 01; não depende dos catálogos completos. Ferramenta em /para-tecnicos/orcamentos. Interpretar atendimento como preenchimento estruturado pelo técnico, não diagnóstico autônomo por IA. MVP privado no navegador, sem envio, assinatura eletrônica, cobrança ou conta.

## Fluxo de trabalho
1. Identificação do prestador: nome, contato e identificação fiscal opcional.
2. Cliente: nome/empresa, contato opcional e endereço somente se necessário; nenhum documento pessoal obrigatório por padrão.
3. Atendimento: tipo de equipamento, relato, observações técnicas, modalidade remota/presencial, localidade e horas estimadas. Campo de número de série opcional, com aviso de minimização.
4. Itens: serviço/peça/deslocamento/outro, descrição, quantidade, unidade, preço unitário, observação e origem da estimativa. Adicionar/remover/duplicar e editar.
5. Condições: prazo estimado, validade, forma de pagamento em texto, exclusões, dependências de diagnóstico e termos fornecidos pelo profissional.
6. Revisar, imprimir/salvar PDF pelo navegador e exportar JSON. Proposta não é nota fiscal nem laudo.

## Regras de cálculo e dados
Quote: schemaVersion, id local, documentNumber editável, createdAt, updatedAt, status draft/issued, provider, customer, serviceContext, items, discount, additionalCharges, terms e currency BRL. Itens com unitPriceCents inteiro e quantity em precisão controlada (ex.: milésimos) para horas fracionadas. Documentar arredondamento em centavos por linha e depois total. Desconto fixo ou percentual mutuamente exclusivo; percentual em basis points; taxas apenas se usuário informar e compreender a base. Não calcular impostos presumidos. Total nunca negativo; limites para números, textos e quantidade de itens.

Não gerar preços a partir de texto do atendimento como se fossem orçamento profissional. Tabela de serviços é configurável pelo usuário e opcional; presets de demonstração não contêm supostos preços de mercado. Sugestões determinísticas podem propor itens sem valor, sempre confirmados pelo técnico. Avisar quando preço é estimado e depende de diagnóstico.

## Privacidade e exportação
Por padrão manter em memória. Botão “Salvar neste dispositivo” explica retenção local e risco em dispositivo compartilhado; lista rascunhos, duplicar, excluir e apagar todos com confirmação contextual. Sem salvar automaticamente PII até escolha explícita. Sem PII em URL, analytics, logs, nome do arquivo ou compartilhamento. Exportação JSON contém dados do cliente e informa isso antes; importação valida schema, tamanho, limites e texto, rejeitando HTML e versões incompatíveis com mensagem útil. JSON não deve executar nada.

PDF inicial via window.print e CSS de impressão, sem serviço remoto; o usuário usa “Salvar como PDF”. A4 legível, cabeçalho com identificação, tabela que quebra páginas, totais e condições sem corte. Testar 1 e 3 páginas, nomes longos, acentos e 40 itens. Marca do portal discreta se incluída e removível; não incluir anúncios ou banners no documento.

## Estados e erros
Formulário inválido mantém dados, aponta primeiro erro e oferece resumo. Armazenamento indisponível/quota excedida avisa e oferece exportar; dado corrompido não apaga tudo silenciosamente. Trocar status para emitido cria snapshot local; edição posterior cria nova revisão e mantém indicação, sem alegar validade jurídica especial.

## Testes e aceite
Cobrir R$ 0, quantidade 1,5 hora, descontos fixo/percentual, arredondamento, desconto maior que subtotal, número negativo, campos vazios e valores extremos. Import malicioso, versão inválida e armazenamento bloqueado não quebram página. Atualizar quantidade reflete totais corretamente; impressão sem navegação/ads; nenhum envio de rede com dados de cliente. PDF legível revisado manualmente. Nenhum preço preenchido automaticamente sem origem e decisão do usuário.

## Monetização
Ferramenta gratuita pode atrair técnicos; recomendações de ferramentas e periféricos ficam fora do formulário e nunca usam dados do cliente. Versão paga e sincronização remota são futuras, sem paywall no MVP.

## Evolução autorizada em 27/10/2026 — fluxo simplificado e Gemini

O proprietário solicitou porte da cidade como primeiro campo, seguido por modalidade presencial/remota, categoria hardware/software/ambos e uma ou mais descrições. Essa autorização substitui a proibição de IA somente para o envio explícito do escopo técnico: nomes, contatos, endereço e documento do cliente permanecem locais. Não enviar o Quote completo, dados de orçamentos anteriores ou dados Icecat.

Fluxo padrão em quatro etapas: Atendimento, Valores, Cliente e condições, Revisão. Gemini sugere honorários por execução em BRL; todos são editáveis. Porte da cidade influencia qualitativamente, sem coeficientes inventados apresentados como pesquisa de mercado; remoto reduz esse peso. Não há pesquisa web, peças, licenças ou deslocamento presumidos. Descrições devem ser técnicas, sem PII. Editor avançado preserva documentos v1, import/export JSON, peças, descontos percentuais e snapshots; adicionais opcionais de contexto/proveniência são compatíveis com v1.

PDF gerado diretamente no navegador com fonte Noto Sans hospedada localmente/OFL, paginação A4, prestador, cliente, escopo, itens, totais, condições editáveis, premissas da IA quando presentes e aceite. Não é nota fiscal/laudo. Persistência continua opcional e local.

Endpoint público separado no Worker existente, sem autenticar leitores ou expor chave. Origin/CORS explícitos, JSON estrito e limite de tamanho, 2 solicitações/minuto/IP, 5/dia/IP e 30/dia globais, com contadores hash/temporários em D1. Sem logs de descrições, repetição automática, grounding, fallback pago ou upgrade. Isso limita abuso, mas Origin não autentica scripts externos. O projeto da chave deve continuar no Free: código não comprova faturamento pela chave. Falha/quota mantém orçamento e permite preços manuais. Implementação/limites em docs/orcamentos-ti.md.
