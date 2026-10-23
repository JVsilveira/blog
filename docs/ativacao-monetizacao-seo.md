# Ativação manual — etapa 08

Estado: nenhuma integração comercial ou de medição ativa. Checklist técnico não concede aprovação editorial, contratual ou legal. Não é necessário AdSense para lançar; não há quantidade garantida de posts para aprovação.

## Afiliados

- [ ] João confirma conta aprovada, canal/origem cadastrado, termos e divulgação obrigatória de cada programa.
- [ ] Inserir em `src/config/monetization.ts` somente programa real: id estável sem PII, merchant correspondente ao catálogo, enabled, approvedAt, termsReviewedAt, validUntil, channelOrigin, allowedHosts exatos e disclosure exigida pelo programa. Datas passadas de aprovação/revisão e validade futura são necessárias; revalidar antes de cada build.
- [ ] Revisar URL HTTPS real de afiliado, destino comum e lastLinkCheck; não inventar parâmetros. Testar navegação sem JS, com bloqueador e por teclado. Links mantêm aba atual e rel sponsored quando monetizados.
- [ ] Confirmar licenças de imagens e usos autorizados. Fonte técnica não concede licença comercial de imagem.
- [ ] Habilitar `site.features.affiliates` somente após essas verificações e origem definitiva em site.origin. Sem programa correspondente, mantém link comum.
- [ ] Manter pricePolicy none por padrão. authorized-feed exige evidência específica sourceId, autorização válida, prazo de cache e observação/expiração. Nenhum feed foi integrado. Essa evidência é uma declaração humana que o código não consegue autenticar. Revisar também atribuição, cache e limites antes de desenvolver acesso a API; chaves nunca no navegador. Não usar preço digitado ou scraping para contornar termos Amazon.

## Publicidade

- [ ] Obter aprovação real do fornecedor e IDs reais, revisar políticas e regiões atendidas.
- [ ] Revisar privacidade/LGPD e requisitos de consentimento; verificar CMP certificada nas regiões exigidas pelo Google (EEE, Reino Unido e Suíça), regras atuais e escolhas efetivas antes de requests. Não usar banner decorativo.
- [ ] Implementar em tarefa posterior o adaptador real, consentimento e lazy load; `AdSlot` atual é inerte mesmo com flag adsense. Não há SDK, publisher ID, ads.txt ou simulação de aprovação. Preview explícito reserva 280px e é apenas local.
- [ ] Validar CSP/headers do host, dimensões antes do carregamento, bloqueador, teclado e layout shift. Slot disponível somente após artigo; nunca em orçamentos/tabelas críticas. Não pedir cliques.

## Métricas e economia

- [ ] Adaptador padrão no-op. `createAnalytics` só registra no console/sink local com enabled + debug explícitos e environment development. A flag sozinha não ativa provedor real. Eventos strict rejeitam propriedades extras, URLs e campos livres; IDs devem vir dos contratos editoriais, nunca derivados de dados de cliente. Não há cookies, fingerprint ou armazenamento de medição.
- [ ] Eventos implementados: visualização de artigo/recomendação (uma por montagem/ID, sem duplicação por rerender), clique afiliado monetizado (merchant = id público do programa), comparação após seleção, abertura de resultado e exportação JSON/diálogo de impressão. Impressão mede abertura do diálogo, não comprova PDF salvo. Eventos PC reservados no contrato; montador não ativado nesta etapa.
- [ ] Para analytics real, decidir fornecedor posteriormente, atualizar política e testes de consentimento/PII/rede antes de adicionar integração. Não usar debug em produção.
- [ ] Preencher metricas.csv manualmente só com dados verificáveis; vazio significa indisponível, não zero. Não inferir venda/comissão pelo clique. Distinguir comissão aprovada e valor recebido; horas e custos reais. Cenários opcionais devem explicitar hipóteses: cliques válidos × conversão × ticket elegível × taxa; anúncios = pageviews/1000 × RPM assumido/observado. Sem promessa de receita.

## SEO e host

- [ ] Confirmar origem HTTPS de produção e configurar NEXT_PUBLIC_SITE_URL (sem segredo), que preenche site.origin. Canonicals de conteúdo/listagens usam essa origem; não configurar origem fictícia para publicação.
- [ ] Revisar textos institucionais e páginas antes de adicioná-las a NEXT_PUBLIC_SEO_APPROVED_PATHS, que preenche site.seo.approvedPaths. Lista limitada às rotas estáticas existentes. Conteúdo vem dos repositórios públicos aprovados; drafts, placeholders, filtros, comparações arbitrárias e orçamentos não entram no sitemap.
- [ ] Somente no build de produção revisado definir NEXT_PUBLIC_SITE_INDEXING=true para habilitar indexingApproved. Preview mantém false, robots disallow e noindex; proteger preview com controle de acesso do host, pois robots/noindex não protegem dados.
- [ ] Validar canonicals, HTML inicial, títulos, autoria, datas, links e sitemap exportados. Artigo/Breadcrumb usam dados aprovados; nenhum Product/Review/AggregateRating foi adicionado.
- [ ] Host deve servir out, 404.html com HTTP 404 para caminhos inexistentes, HTTPS e headers adequados. Configurar redirecionamento de host canônico no provedor, sem backend no app. Testar staging e produção separadamente antes de publicar.

## Fontes oficiais consultadas em 22/10/2026

- Next Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Arquivos metadata (robots/sitemap): https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Google CMP/regiões: https://support.google.com/adsense/answer/13554020?hl=en
- Amazon Brasil políticas: https://associados.amazon.com.br/help/operating/policies/

Reconsultar políticas antes da ativação; este registro não substitui os termos do programa.

Detalhes de configuração das rotas revisadas, verificação de propriedade, auditoria do export e conteúdo para buscas/IA em [SEO e descoberta](seo-e-descoberta.md).
