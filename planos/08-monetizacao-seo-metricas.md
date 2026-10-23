# 08 — Afiliados, AdSense, SEO e medição

## Resultado e dependências
Depende de 03 e 04; executar antes do lançamento do núcleo. Implementar pontos de integração desligados por padrão. Cadastro/aprovação de programas, domínio e conteúdo revisado são dependências externas, não tarefas que a IA pode simular.

## Afiliados
Centralizar ofertas e configuração por programa. Aviso contextual de comissão, rel sponsored, sem forçar abertura de abas. Respeitar regras atuais sobre imagens, preço, tracking, canais cadastrados e divulgação. Não assumir que preço digitado manualmente com data satisfaz regras de Amazon; por padrão não mostrar preço do varejista. Antes de habilitar feed/API, validar acesso comercial, termos, limites, cache e atribuição. Não obter preços por scraping. Incluir checklist para proprietário informar conta aprovada, canal cadastrado e URL de afiliado real.

## AdSense
Componente AdSlot com dimensões reservadas, lazy load quando aplicável e flag desligada. Slots recomendados em artigos entre seções longas e após conteúdo; zero dentro de formulário de orçamento e tabelas críticas de ferramentas. Não inserir ads que pareçam recomendação editorial, não pedir cliques e não usar popunders. IDs de exemplo nunca geram requests reais. Script somente quando proprietário configurar, aprovação estiver confirmada e requisitos de privacidade aplicáveis estiverem atendidos. Consentimento deve obedecer regras atuais do fornecedor e regiões atendidas; verificar necessidade de CMP certificada e nunca construir banner cenográfico que declara conformidade. Documentação de implantação deve identificar esta dependência antes de ativar publicidade.

## Privacidade de medição
Criar interface AnalyticsAdapter com padrão no-op e modo debug só em desenvolvimento, sem trackers externos. Eventos permitidos: article_view{articleId}, recommendation_view{productId}, affiliate_click{productId,merchant,placement}, pc_builder_start, pc_builder_complete{status}, phone_compare{modelIds}, quote_export{format}, search_result_open{contentId}. Proibir relato de atendimento, nome/email, orçamento integral, termos livres e URL de afiliado completa nos payloads. Evitar duplicação por rerender e permitir desligamento. Não usar impressão digital ou cookies próprios desnecessários. analytics real é decisão posterior com política atualizada.

## SEO técnico e editorial
HTML estático indexável, headings sem saltos arbitrários, canonicals somente após origem de produção definida, sitemap de URLs públicas aprovadas, robots, 404 real e links internos. Preview/staging protegidos de indexação, preferencialmente com controle de acesso do host; noindex sozinho não protege dados privados. Títulos e snippets úteis, sem promessa de primeira posição. Artigo com autoria e datas corretas; Product/Review structured data só quando critérios atuais forem verificados e dados reais sustentarem. Não publicar AggregateRating, estoque, oferta ou avaliações inventados.

## Economia e metas
Planilha simples opcional de acompanhamento em docs/metricas.csv: semana, artigos publicados/revisados, sessões quando disponíveis, cliques afiliados, vendas aprovadas, comissão aprovada, valor efetivamente recebido, horas trabalhadas, custos. Separar atribuição e recebimento; não inferir comissão pelo clique. Fórmula: comissão estimada = cliques válidos × conversão hipotética × ticket elegível × taxa aplicável. Valores são cenários, não previsão. Receita publicitária hipotética = pageviews/1000 × RPM observado ou assumido claramente. Não usar taxas promocionais máximas como média garantida.

## Aceite
Sem config nenhuma requisição para ads/analytics. Aviso e atributo de afiliado corretos; teste de payload assegura ausência de PII. AdSlot não desloca botão durante uso; navegação funciona com bloqueador. Sitemap não contém drafts/combinações arbitrárias. Política de privacidade descreve o que foi realmente implementado. Lançamento não depende de aprovação AdSense e não há número mágico de posts para aprovar.
