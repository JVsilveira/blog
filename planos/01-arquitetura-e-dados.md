# 01 — Arquitetura, contratos e operação sem serviços pagos

## Decisão inicial
React + TypeScript strict, usando Next.js App Router em modo de exportação estática. Motivo: artigos e páginas públicas chegam em HTML, enquanto ferramentas usam componentes cliente. JavaScript fica nos arquivos de configuração quando necessário. O pedido React permanece atendido; não adicionar outro framework de UI.

Usar versão estável compatível no momento da execução e registrar Node e gerenciador no README, engines e lockfile. Não fixar neste planejamento números que podem envelhecer. CSS Modules + CSS custom properties; biblioteca de componentes não é obrigatória. Vitest para domínio; React Testing Library para formulários críticos; Playwright para percursos de ponta a ponta. Validar compatibilidade das ferramentas com versões instaladas.

Configuração de export estático: output export; gerar parâmetros das rotas de conteúdo no build; otimização de imagens compatível com hosting estático, via geração prévia de variantes ou configuração sem servidor de imagem. Não depender de API routes, middleware, cookies de servidor, redirects dinâmicos ou server actions. Interações locais hidratam apenas quando necessárias. Busca local carrega índice leve sob demanda. Paginação de conteúdo com páginas HTML geradas.

Hosting pretendido: provedor estático com plano gratuito, sujeito às regras e cotas atuais. Criar instruções portáveis para qualquer host que sirva o diretório exportado. Não presumir que um plano pessoal autoriza uso comercial. Não contratar nem publicar durante implementação.

## Estrutura proposta
- src/app: rotas, layouts e metadados.
- src/components/ui: controles e padrões acessíveis.
- src/features/blog, recommendations, pc-builder, phones, quotes: UI e adaptadores por módulo.
- src/domain: funções puras de compatibilidade, totais e comparação.
- src/content/articles: Markdown/MDX local de autores confiáveis; sem execução de conteúdo enviado por usuários.
- src/data: produtos, configurações, celulares, serviços e fontes em JSON versionado.
- src/lib: validação, conteúdo, armazenamento e analytics abstrato.
- src/config/site.ts: marca, autor, URLs, flags e identificadores públicos.
- scripts: validação editorial, export/import e auditoria de links local.
- public: ativos licenciados e manifestos públicos necessários.
- docs: decisões, operação, progresso e checklist de lançamento.
Ajustar nomes à estrutura existente e registrar diferenças.

## Contratos compartilhados
Todos os registros usam id estável, schemaVersion quando persistidos, status draft/published/archived e timestamps ISO. Valores monetários internos são inteiros em centavos BRL; nunca ponto flutuante para totalizar dinheiro. Distinguir null (desconhecido), false e zero.

SourceReference: id, url https, publisher, accessedAt, scope (campos que sustenta), note opcional. URLs de fonte não são automaticamente links de compra.

Product: id, slug, name, brand, category, specs tipadas por categoria, sourceIds[], images[{src,alt,rightsSource}], verificationStatus, verifiedAt, editorialStatus. Não usar um único mapa de strings para todas as especificações críticas.

AffiliateOffer: id, productId, merchant, destinationUrl, affiliateUrl opcional, enabled, verifiedAt, pricePolicy (none/authorized-feed), priceCents opcional, currency, observedAt opcional, expiresAt opcional e sourceId. Sem autorização válida e atualização exigida, preço não aparece. Sem affiliateUrl real, CTA pode ser link normal claramente tratado como não monetizado; nunca inventar tracking.

Article: slug, title, description, authorId, category, tags, publishedAt, updatedAt, sourceIds, relatedProductIds, methodology, status, body. ReviewClaim: productId, method (hands-on/documental/editorial), ownerApprovedAt opcional, pros[], cons[], bestFor[], avoidIf[]. Hands-on exige confirmação real.

Campos detalhados PC/Phone/Quote nos planos próprios. Repositórios de leitura fornecem dados validados e não conhecem UI. Catálogo público só expõe produtos publicados e aprovados. Fixtures em tests/fixtures nunca alimentam build de produção.

## Persistência e privacidade
Sem contas ou banco no MVP. Conteúdo e produtos via Git; revisão e novo build atualizam o site. Orçamentos são distintos e privados: memória até usuário escolher salvar localmente; IndexedDB ou localStorage com limite explícito, recuperação de corrupção e export/import JSON. Avisar que limpar dados do navegador remove rascunhos e que computador compartilhado exige cuidado. Não enviar dados de clientes a Git, telemetria, URL pública ou servidor de PDF.

## Segurança e integridade
Links externos aceitam apenas http/https conforme função; preferir https; rejeitar javascript/data/file. Sanitizar textos importados e renderizar sem HTML arbitrário. Sem dangerouslySetInnerHTML para dados não confiáveis. JSON-LD somente serialização segura de dados verificados. Campos públicos de ambiente não contêm chaves secretas. CSP e outros headers documentados para host, com revisão específica quando ads forem habilitados.

## Evolução
Se surgir requisito real de autenticação, sincronização de orçamentos ou painel remoto, criar ADR e novo orçamento técnico antes de alterar arquitetura. Migração pode manter contratos e repositórios. Nenhuma necessidade atual justifica servidor Java ou banco pago.

## Aceite e testes
Build exportado serve conteúdo público sem JS; artigo/slug inexistente retorna 404 no host de teste. Esquemas rejeitam IDs duplicados, referências quebradas, datas inválidas, status indevido e links perigosos. Testar atualização de conteúdo sem alteração de componentes. Validar centavos e campos desconhecidos. Documentar npm scripts reais e execução offline após instalação. Smoke test do diretório exportado, não apenas do dev server.

## ADR — Área editorial Google OAuth (22/10/2026)

Requisito remoto e autenticação solicitados explicitamente pelo proprietário. Aplicação Next Node separada em admin/, com Google OAuth, allowlist no servidor e checkout persistente. Site público permanece estático. Este ADR autoriza somente esse backend editorial e substitui a restrição de operação exclusivamente local neste recorte. Contratos e privacidade dos outros módulos permanecem. Requisitos de hospedagem, persistência, custo operacional ainda a avaliar e ativação real em [painel-google-oauth](../docs/editorial/painel-google-oauth.md). Nenhuma contratação/publicação autorizada implicitamente.

## Evolução autorizada — portal editorial internacional (22/10/2026)

O proprietário ampliou o escopo para notícias, opinião e blog sobre política, esporte, economia e outros temas. Edições português, inglês e espanhol, preferência do navegador e seletor manual, conteúdo traduzido com revisão própria. Route groups permitem layouts raiz por idioma preservando URLs anteriores e export estático; global-not-found cobre 404 entre layouts. API/Gemini continua privada apenas no painel, sem tradução por request de leitor nem custo adicional de geolocalização. Detalhes e limites em [Portal editorial internacional](../docs/portal-editorial-internacional.md). Esta autorização substitui o escopo exclusivamente tecnológico, preservando regras de fontes, revisão e não inventar conteúdo.

## Evolução autorizada — catálogo automático Icecat (23/10/2026)

O proprietário dispensou explicitamente aprovação manual das fichas dos comparadores e pediu toda a cobertura gratuita nas categorias celular, CPU e RAM. Este recorte substitui a exigência anterior de revisão humana para fichas do Icecat: `publication: provider`, status publicado, revisão e revisor nulos, origem/licença preservadas. Índice Open completo inicial, deltas diários, importação progressiva contínua e atualização pública de feeds estáticos sem build por ficha. Conteúdo editorial, notícias e recomendações humanas permanecem sujeitos às regras anteriores. Não contratar serviços nem ativar upgrade; limitar chamadas antes do patamar de uso excessivo do provedor.

## ADR — Painel editorial no Cloudflare Workers + D1 (23/10/2026)

O proprietário autorizou colocar a administração no ar, mantendo ausência de serviços pagos. O site público permanece um export Next.js no Pages. A interface editorial compartilhada é empacotada como SPA; `cloud-admin/` executa OAuth Google, sessões privadas, validação e persistência no D1. Isso substitui a exigência de checkout Node persistente somente para postagens, autores e fontes. O painel Node local permanece disponível, inclusive sincronização pesada Icecat e autorização Mercado Livre; essas rotinas não foram migradas para o Worker nesta etapa.

Regras de domínio/mutação extraídas em módulos compartilhados; nenhum login de leitores. Sessões de oito horas e transações OAuth de dez minutos em D1 com chaves opacas hash; PKCE, state, nonce, validação criptográfica do ID token pela biblioteca Google e allowlist privada. Mutação exige Origin e CSRF. Histórico e revisão com comparação atômica impedem sobrescritas; publicação e alterações se excluem por condição no banco.

Pages recebe snapshot por endpoint autenticado com Bearer privado somente durante build de produção. Conteúdo não aprovado continua excluído do HTML, busca e sitemap pelos contratos existentes. Token de exportação é removido do ambiente antes do compilador público. Botão publicar aciona deploy hook privado; a entrega só é confirmada ao comparar revisão com manifesto público. Falhas e limites não simulam sucesso. Sem contratação, plano pago, R2, fallback pago ou persistência de orçamentos de clientes. Operação em `docs/editorial/painel-cloudflare.md`.

## ADR — Sugestão pública opcional para orçamento TI (27/10/2026)

Autorizado pelo proprietário usar Gemini para precificação sugerida. Site continua estático; POST público `/api/quotes/suggest` no Worker existente recebe somente porte, modalidade, categoria e descrições técnicas com IDs opacos. A chave existente continua em secret no servidor. Não usar sessão administrativa para leitores; CORS/Origin, contadores atômicos temporários, limites globais e por IP, timeout e schemas restritos. Nenhum nome/contato/endereço é enviado pelo cliente. Request não é persistido. Quota/falha não gera preço fictício nem aciona fallback pago. PDF e dados identificáveis continuam no navegador. Ver o plano 07 e docs/orcamentos-ti.md.
