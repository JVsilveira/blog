# Vitrine de recomendações — Mercado Livre

Implementação autorizada pelo proprietário em 28/10/2026. A vitrine comercial em `/recomendacoes/` é independente das avaliações editoriais. Não criar ReviewClaim, aprovação humana, experiência pessoal ou nota automática para uma ficha importada da loja.

## Cadastro e atualização

No painel online, abrir Produtos e comparadores. Após conectar o Mercado Livre, usar Recomendações e ofertas: colar link de afiliado individual e, se o encurtador não identificar o produto, a página completa correspondente. Adicionar à vitrine importa ficha e ofertas pela conta OAuth. O link original permanece no CTA; não converter link de vitrine em link de produto nem fabricar parâmetros de atribuição. Comissão/atribuição final depende do programa; presença de tracking não comprova elegibilidade ou pagamento.

O catálogo comercial fica em registros `recommendation:MLB…` da tabela privada settings, sem migração das avaliações editoriais ou dos artigos. Máximo de 24 produtos; remoção afeta somente a vitrine, preservando artigos. O registro completo inclui diagnóstico interno, nunca enviado ao público. API administrativa exige sessão Google autorizada, Origin e CSRF.

Atualização cron a cada 30 minutos processa até seis produtos, priorizando os mais antigos, para manter chamadas dentro das cotas gratuitas. Até 24 produtos percorrem um ciclo em aproximadamente duas horas, sujeito a disponibilidade/cotas. Botão Atualizar preços antecipa uma execução. Trava de concorrência e UPDATE condicionado ao valor anterior impedem reintroduzir produto removido enquanto a consulta estava em andamento.

## Preços verificados

Consultar catálogo `/products/{id}` e anúncios associados `/products/{id}/items?limit=20`. A conta real liberou a listagem associada, embora `/items/{id}` e `/items/{id}/sale_price` tenham retornado 403. Consulta preferencial de preço por anúncio usa contexto `channel_marketplace`; quando recusada, o fallback usa `price`, `original_price` e `currency_id=BRL` do mesmo anúncio retornado na listagem associada. Ignorar preços inválidos, moeda diferente, estoque explicitamente zero e anúncios explicitamente inativos. A listagem pode não cobrir todos os vendedores; nunca alegar menor preço global.

Em catálogo, o valor é apresentado como **a partir de**, com vendedor variável. Desconto é calculado somente se referência positiva da mesma oferta for superior ao preço atual. A referência é informada pela loja e não comprova preço histórico, cupom ou preço pessoal/Meli+. Nenhum frete grátis é prometido. Validade de três horas; preço futuro, vencido ou produto indisponível não pode aparecer. Falhas de atualização removem o preço; 404 remove o produto da listagem pública, mantendo registro para nova tentativa.

TV fornecida pelo proprietário, MLB49197371: consulta real retornou preço 104405 centavos e referência 124900 centavos no anúncio MLB5800037458, além de sete fotos e 44 atributos. Isso é evidência pontual, não valor permanente. Não há comissão confirmada nem API de geração de links de afiliado confirmada. Não usar IA para inventar dados ou avaliar a qualidade de uma TV pelo título.

## Entrega pública

GET `https://api.silfontech.com.br/api/recommendations` retorna somente cards ativos validados, sem credenciais ou diagnóstico privado. Cache de 60 segundos. O cliente consulta ao abrir e a cada cinco minutos enquanto visível; relógio local remove preço vencido. Preços não entram no HTML estático: aparecem após validação do feed. Sem JS, card inicial continua com imagem, descrição e CTA para consultar na loja.

O export privado editorial inclui um snapshot público de recommendations para o build inicial. O importador valida antes de escrever em src/data/recommendations.json; `src/data/catalog.json` e suas aprovações permanecem independentes. Novos cadastros aparecem pela API sem rebuild; snapshot/HTML inicial recebe mudanças no próximo build. Fotos remotas limitadas a HTTPS mlstatic.com sem credenciais, portas ou query assinada. Transparência comercial está na vitrine, no rodapé e em /afiliados/.

## Operação

`scripts/configure-mercado-cloud.ts` envia somente credenciais aos secrets. `scripts/probe-mercado-cloud.ts <link>` executa diagnóstico privado com credencial temporária exclusiva. `scripts/import-recommendation-cloud.ts <link> [pagina-completa]` permite cadastro operacional solicitado pelo proprietário; o uso normal é pelo painel. Ambos ativam a versão atual do Worker e removem o segredo de diagnóstico em finally. A rota interna não funciona sem esse segredo; nunca reutilizar token de exportação para autorizar mutações comerciais.

Fonte de preços: [documentação de preços](https://developers.mercadolivre.com.br/pt_br/produto-consulta-de-usuarios/api-de-precos). Fonte de fichas: [buscador de produtos](https://developers.mercadolivre.com.br/buscador-de-produtos). A listagem associada foi validada empiricamente com a conta do proprietário, sem depender de scraping.
