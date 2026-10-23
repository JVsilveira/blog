# Arquitetura implementada — etapa 01

## Fronteiras e decisões

Next.js App Router exporta HTML em `out/`, React e TypeScript strict (`noUncheckedIndexedAccess`). Não há API, autenticação, banco, server actions, cookies de servidor, anúncios, analytics ou armazenamento de clientes. `src/config/site.ts` centraliza marca, autor, origem ausente e flags desligadas. A única UI desta etapa é um estado vazio editorial e a página 404; a fundação visual completa pertence à etapa 02. Robots permanece noindex até revisão de lançamento.

`src/domain` contém schemas Zod estritos e apresentação pura de ofertas; `src/lib/catalog.ts` valida relações e fornece cópias tipadas do conteúdo público. `src/lib/content.ts` lê arquivos somente durante o build. Não importar o loader em componentes cliente. Fixtures ficam exclusivamente em `tests/fixtures`; não são fonte do build, busca ou rotas. Não há flag de demonstração pública. Ausência de conteúdo é válida; erro de conteúdo interrompe o build, sem fallback para dados fictícios.

Produtos precisam de identidade, fontes, verificação aprovada, aprovação humana e estado editorial publicado para publicação. Os campos técnicos iniciais cobrem CPU, RAM e armazenamento, com união discriminada; `null`, `false` e zero são preservados. Demais categorias e contratos específicos de PhoneVariant, configurações/Build e Quote serão acrescentados nas etapas 05–07, antes de serem consumidos. Não aceitar mapas genéricos de specs para contornar essa restrição. Não foi implementado motor de compatibilidade, comparação nem cálculo de orçamento. Isso delimita suporte mínimo sem executar esses módulos.

Todos os registros locais têm schemaVersion 1, ID estável, status e timestamps ISO com fuso. Article usa `updatedAt` como data de revisão informada, nunca o relógio do build. Aprovações `ownerApprovedAt` são evidências humanas, não produzidas por este software. ReviewClaim hands-on publicado exige confirmação. IDs únicos por coleção; slugs únicos por tipo. Referências de publicados não podem apontar a drafts/arquivados. Dinheiro BRL em centavos inteiros seguros; não há soma de preços de lojas.

Oferta padrão não tem preço, usa “Consultar preço na loja” e link HTTPS direto. Afiliados desligados usam destinationUrl e não o tracking. Preço authorized-feed exige priceCents, observedAt, expiresAt e authorization com sourceId da evidência, validUntil e maxAgeHours (até 168h); `presentOffer` exige relógio explícito e oculta preço fora da janela, no futuro ou com autorização vencida. Não há integração ativa de feed. Declarações em JSON não substituem a verificação humana da autorização. Links externos rejeitam esquemas perigosos e credenciais embutidas. Imagens aceitam apenas caminhos locais em `/images/`, dimensões, alt e fonte dos direitos; arquivo ausente bloqueia build.

## Conteúdo local

`src/data/catalog.json` tem schemaVersion, sources, authors, products, offers e reviews. As coleções começam vazias. Cada artigo futuro usa `src/content/articles/<slug>/article.json` com todos os campos de articleSchema exceto body; `body.md` fornece o corpo Markdown confiável. Não há MDX executável ou upload de terceiros. HTML bruto é recusado. A renderização Markdown e auditoria dos links editoriais completos serão realizadas com o blog na etapa 03; nenhum corpo editorial é renderizado nesta etapa.

Para cadastrar: criar fontes e autor com dados reais; cadastrar o registro como draft com datas reais e aprovação null; escrever Markdown; executar `npm run validate:content`. Após revisão humana, preencher aprovação e datas de publicação/revisão e alterar os estados pertinentes. Rebuild atualiza o repositório sem editar componentes. Consulte os schemas em `src/domain/schemas.ts` para os campos exatos; o teste de carregamento local demonstra essa troca em diretório temporário, sem publicar fixtures. A aprovação editorial permanece pendente para todas as coleções de produção.

## Rotas e imagens

Rotas atuais: `/` e `404.html`. Não expor rotas das features desligadas. A etapa 03 deverá usar `generateStaticParams()` com `repository.articleParams()`, `dynamicParams = false` e lookup apenas em `articleBySlug`. Slugs inéditos exigem rebuild; nunca fallback SPA ou geração sob demanda. Paginação será HTML no build. Nenhuma rota dinâmica de blog foi antecipada nesta etapa; a comprovação de um artigo real no HTML depende da etapa 03 e de conteúdo aprovado. O smoke atual confirma a home sem JS e a ausência de rotas inexistentes/drafts.

`images.unoptimized: true` dispensa servidor de otimização. Futuros ativos autorizados devem ser locais e previamente dimensionados/comprimidos; Next Image precisa de width/height e alt. Não há fotos, fontes remotas ou assets fictícios. Variantes responsivas podem ser geradas previamente quando existirem imagens reais; não foi instalado processador de imagens sem necessidade.

## Execução e hospedagem portátil

Ambiente verificado: Node 26.12.0, npm 12.2.1. Engines: Node >=22.12 <27, npm >=10 <13. Lockfile fixa Next 16.4.2, React 19.3.1, TypeScript 6.0.3, Zod 4.6.7, Vitest 5.0.5 e demais ferramentas. TypeScript 7 foi descartado por incompatibilidade declarada pelo parser do ESLint; ESLint 9.39.5 mantém compatibilidade com os plugins do Next, apesar do aviso upstream de suporte encerrado. ESLint 10 ainda conflita com os peers desses plugins. Reavaliar o conjunto em atualização coordenada.

Instalar com `npm ci`. Depois da instalação, `npm run build`, `typecheck`, `lint`, `test` e `validate:content` usam arquivos locais e dispensam rede. `npm run dev` inicia desenvolvimento; `npm run serve:export` exige Python 3 e serve `out/` localmente em 4173. `npm run smoke` inicia host efêmero de teste e encerra-o automaticamente, exigindo build anterior. Não usar `next start` com output export. O sandbox desta sessão restringe sockets/subprocessos: build e smoke foram executados com permissão de execução ampliada; não foi desabilitada a checagem TypeScript.

Um host real deve servir `out/`, resolver `/caminho/` para `/caminho/index.html`, retornar status 404 com `/404.html` quando ausente e não reescrever URLs desconhecidas para index.html. HTTPS e headers pertencem ao host: configurar X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, frame-ancestors 'none', object-src 'none' e base-uri 'self' em CSP. A CSP de scripts precisa considerar os scripts inline do App Router por hashes gerados a cada build; testar política em Report-Only antes de aplicar. Anúncios futuros exigem revisão própria. Nada foi configurado ou publicado em provedor. Verificar cotas, termos comerciais, TLS e headers antes da publicação.

## Referências oficiais consultadas em 21/10/2026

- [Next: instalação e lint separado](https://nextjs.org/docs/app/getting-started/installation).
- [Next: static exports, imagens e limitações](https://nextjs.org/docs/app/guides/static-exports).
- [Zod: schemas estritos, URLs e datas ISO](https://zod.dev/api).
- [Vitest 5: requisitos](https://main.vitest.dev/blog/vitest-5).
- Versões estáveis consultadas no registro oficial npm; compatibilidade também verificada por instalação e execução local.
