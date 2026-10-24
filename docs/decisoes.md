# Decisões do Portal Tech

Registro de 21/10/2026, etapa 00. As decisões abaixo documentam a implementação futura; não indicam funcionalidades já disponíveis. Referências vinculantes: [AGENTS.md](../AGENTS.md), [diretrizes](../planos/00-diretrizes-gerais.md) e [arquitetura e contratos](../planos/01-arquitetura-e-dados.md).

## Escopo e regras

O AGENTS.md existente já está na raiz e foi preservado integralmente. Esta etapa cria somente documentação. Não exige instalar dependências, inicializar Next.js ou implementar módulos. Não foram identificados conflitos materiais entre os planos; pendências humanas e externas estão em [pendencias-editoriais.md](pendencias-editoriais.md).

## Marca e proposta

Portal Tech é o nome interno provisório, sem confirmação de marca registrada ou domínio. João é o proprietário e a autoridade editorial prevista; biografia, qualificações, foto e contato não serão presumidos. Proposta: “Entenda o problema, compare suas opções e escolha com segurança”. Público principal: consumidores, estudantes e pessoas em home office; técnicos terão seção própria.

Na etapa 01, centralizar marca, autor, URLs e flags em `src/config/site.ts`. Marca e domínio poderão ser substituídos sem editar componentes. Origem de produção e identificadores externos permanecem ausentes até confirmação; não gerar canonical com domínio fictício.

## Stack e operação

Adotar React + TypeScript strict com Next.js App Router e exportação estática, conforme plano 01. CSS Modules e custom properties; regras de domínio em funções puras. Conteúdo local versionado, sem backend, login, banco remoto ou serviço pago no MVP. Não depender de recursos que exijam servidor em execução.

Versões de Next.js, React, Node e ferramentas serão escolhidas na etapa 01 após consultar documentação oficial atual e compatibilidade. Registrar versões, engines, gerenciador, scripts reais e lockfile nessa etapa. Nenhuma versão ou configuração foi validada nesta etapa documental. As referências de fornecedores em FONTES-E-DECISOES.md não equivalem a uma nova consulta realizada agora.

Hospedagem estática deve ser portátil e ter condições de uso comercial e cotas verificadas antes da escolha. Publicação, contratação, cadastro externo e custos exigem etapa própria autorizada.

## Flags propostas e condições de ativação

Convenção local reversível a implementar na etapa 01; nenhuma flag executável foi criada agora. Valores ausentes devem equivaler a desligado. Flag ligada não substitui validação de dados, aprovação editorial nem autorização de publicação.

| Flag em `site.features` | Inicial | Condição para ativar |
| --- | --- | --- |
| `blog` | `false` | Etapa 03 validada e conteúdo revisado/aprovado |
| `recommendations` | `false` | Etapa 04 validada e recomendações verificadas |
| `pcConfigurations` | `false` | Etapa 05A validada com configurações reais revisadas |
| `pcBuilder` | `false` | Etapa 05B validada e catálogo suficiente para as regras |
| `phones` | `false` | Etapa 06 validada com variantes verificadas |
| `quotes` | `false` | Etapa 07 validada, incluindo privacidade e impressão |
| `affiliates` | `false` | Programa/canal aprovados, regras atuais verificadas, links reais e aviso contextual |
| `adsense` | `false` | Decisão posterior, aprovação, configuração real e requisitos de privacidade atendidos |
| `analytics` | `false` | Decisão posterior, política atualizada e payloads sem dados pessoais verificados |

Módulos futuros ficam ocultos na navegação e não podem parecer prontos por URL direta. Definir proteção das rotas/export na implementação de cada módulo. Recomendações podem funcionar com links normais declarados, sem monetização. Ads e analytics não devem realizar requisições quando desligados; analytics terá adaptador no-op. Fixtures e previews permanecem separados do export público, sem flag pública que libere demonstrações em produção.

## Dados reais, contratos e revisão

- Não inventar produtos, specs, benchmarks, experiências pessoais, preços, estoque, avaliações, clientes, fontes, licenças ou tracking. Dados ausentes permanecem desconhecidos; `null`, `false` e zero são distintos.
- Registros seguem os contratos do plano 01: IDs estáveis, versão de schema quando persistidos, timestamps ISO e estados editoriais. Conteúdo não revisado fica `draft`; publicação exige revisão humana. Catálogo público contém apenas publicados e aprovados. `Quote` segue seu contrato específico no plano 07, com estados `draft/issued`, sem entrar no catálogo público.
- Artigos registram autoria, datas reais de publicação/revisão, fontes, método e limitações. Rebuild não muda data de revisão. Alegações de uso pessoal exigem confirmação de João; testes técnicos não conferem aprovação editorial.
- Fontes registram URL, editor, data de acesso e campos sustentados. Imagens exigem origem de direitos e texto alternativo. Conflitos de fontes ficam documentados ou desconhecidos, sem completar por plausibilidade.
- Fixtures sintéticas ficam exclusivamente em `tests/fixtures` ou previews isolados e nunca alimentam build público, busca ou sitemap. Sem conteúdo aprovado, usar estado vazio honesto; não preencher páginas com demonstração.
- Dinheiro é inteiro em centavos BRL. Datas e valores exibidos em pt-BR. Preço de varejista só com integração e autorização verificadas; padrão de compra: “Consultar preço na loja”. Estimativas editoriais, quando permitidas, precisam de identificação e evidência.
- Compatibilidade desconhecida não é aprovada. PCs e celulares obedecerão aos contratos específicos dos planos 05 e 06; esta etapa não cria catálogo nem motor.

## Confiança, privacidade e experiência

Visual editorial escuro azul conforme tokens do plano 00, fonte de sistema, sem dashboard na home. Meta WCAG 2.2 AA: contraste real, teclado, foco visível, mobile-first, reduced motion e sem overflow global em 320 px; validar também 360/390/768/1024/1440 px quando houver interface. Módulos terão estados de vazio, erro, carregamento e sucesso pertinentes, sem botões falsos ou links `#`.

Não colocar segredos no cliente. Não coletar dados de clientes nesta etapa. A futura ferramenta de orçamentos mantém dados em memória até escolha explícita de salvar no dispositivo; nunca em Git, analytics, logs, URLs públicas ou serviços remotos de PDF. Importações e links exigirão validação conforme contratos.

Afiliados são a primeira hipótese de monetização, com divulgação contextual e sem promessa de receita. AdSense é opcional posterior e não bloqueia lançamento. Políticas públicas deverão descrever somente sistemas realmente implementados.

## Implementação da etapa 01 — 21/10/2026

A base técnica agora existe. As decisões inicialmente propostas acima foram materializadas para configuração central, flags desligadas, schemas, repositórios e export estático. Consulte [arquitetura.md](arquitetura.md) para versões, limites dos contratos, formato do conteúdo, validação de ofertas, estratégia de imagens/rotas e hosting. As decisões da etapa 00 permanecem como histórico; “nenhuma versão validada” e “nenhuma flag executável” descrevem somente aquela etapa. Não houve aprovação editorial nem ativação de módulos.

## Etapa 02 — Fundação visual — 21/10/2026

- Mantidas as versões e o lockfile da etapa 01; nenhuma dependência adicionada. UI nativa, CSS custom properties para tokens e padrões compartilhados; CSS Module para composição da abertura da home. Fonte de sistema, sem downloads de fontes ou imagens. Favicon SVG próprio provisório em `public/icon.svg`.
- Direção: azul escuro fosco (#0B1120 / #111C2E / #18253B), texto #E6EDF7, apoio #A7B6CC, destaque #60A5FA e botão #1D4ED8. Home com título à esquerda e nota editorial à direita, caminhos horizontais e lista de guias, evitando vitrine de produtos. Mobile empilha o conteúdo.
- Catálogo vazio preservado. Busca/listagem é componente de apresentação local reutilizável com dados passados por props; recebe lista vazia enquanto blog estiver desligado. Filtros por categoria só aparecem se houver itens. Não foram implementados índice sob demanda, publicação, Markdown, URLs de artigos ou paginação da etapa 03. Sem resultados, oferece limpar busca; não transmite o texto nem grava em URL/storage.
- Cabeçalho usa somente Guias (âncora real), Sobre e Metodologia. Recomendações, PCs, celulares, técnicos e anúncios não são anunciados. `AdSlot` retorna null; `ProductSummary` exige estado publicado/aprovado e não cria oferta, preço ou alegação de uso. Flags de integrações continuam desligadas.
- Menu móvel usa `dialog.showModal()` com Escape, fechamento explícito e retorno de foco. Chromium apresentou parada fora do conteúdo no ciclo nativo de Tab; adicionado ciclo explícito de Tab/Shift+Tab nos extremos e revalidado. Sem biblioteca de modal.
- Páginas institucionais são rascunhos técnicos locais, com aviso explícito, `noindex` herdado e aprovação pendente; não são políticas aprovadas. Contato informa ausência de canal e não possui formulário. Não há cadastro do responsável, endereço ou experiência profissional inventados. Publicação permanece bloqueada pelas pendências documentadas.
- Base de detalhe institucional inclui breadcrumbs, sumário por âncoras, seções e voltar ao topo. Template de artigo e sumário lateral de artigos serão conectados na etapa 03, sem rotas fictícias nesta etapa.
- Metadados estáticos e ícone usam API já instalada. Consultadas as referências oficiais atuais de [metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) e [error boundary](https://nextjs.org/docs/app/api-reference/file-conventions/error). `reset` está presente no contrato local de Next 16.4.2 (`error-boundary.d.ts`) e é usado para tentar renderizar novamente o componente; falha de dados em build continua fatal, sem sucesso simulado ou exposição do erro técnico ao visitante.

## Etapa 03 — Blog local — 21/10/2026

- `react-markdown` 10.1.0 é a única dependência direta nova, fixada no lockfile. CommonMark no build, sem MDX executável, HTML bruto ou plugin de HTML. Renderizador fica no servidor de build; só busca e cópia hidratam. Consultadas as APIs oficiais de [export estático](https://nextjs.org/docs/app/guides/static-exports), [metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) e [react-markdown](https://github.com/remarkjs/react-markdown).
- Blog está disponível tecnicamente: `features.blog` true passa a significar módulo implementado localmente. Isso atualiza a condição histórica da flag: conteúdo continua dependendo de status published, aprovação, fontes e autor aprovado; a flag não concede aprovação nem libera deploy. Demais módulos permanecem desligados.
- URLs: `/ajuda/`, `/ajuda/[slug]/`, `/ajuda/pagina/[page]/`, `/ajuda/categoria/[category]/` e paginação da categoria. Seis artigos por página; ordenação por publicação decrescente e slug como desempate. Categorias derivadas somente dos publicados, sem categorias vazias. Slugs de categoria ambíguos e metadados públicos duplicados bloqueiam build.
- Índice estático `/indice-busca.json`, carregado no primeiro submit e reutilizado em memória. Apenas slug, título, resumo, tags e categoria dos publicados. Busca local AND por palavras, normalizada para acentos/caixa, sem termo em URL, storage ou eventos. Nenhum serviço de busca, analytics ou coleta. HTML da listagem e links de paginação permanecem disponíveis sem JS.
- Next 16.4.2 falha no export com generateStaticParams vazio. Parâmetros internos reservados levam a notFound; `scripts/finalize-export.ts` remove os artefatos HTML desses caminhos, que de outra forma responderiam 200 em hosts simples. Sempre executar `npm run build`, não `next build` isoladamente. Smoke comprova 404 desses caminhos. Nenhum artigo/fixture é usado para satisfazer o framework.
- Canonical e JSON-LD Article/Breadcrumb somente com origem confirmada. Não há domínio substituto: sitemap vazio, robots Disallow e noindex preservados. Listagens e artigos têm títulos/descrições específicos e Open Graph; ativo `public/og-blog.png` composto localmente com fundo, formas e texto do projeto, sem foto de produto. Não há Review/FAQ schema. JSON-LD escapa `<`; publicações verificadas são a única entrada.
- Imagens Markdown não são publicadas até contrato de captura/direitos; nenhuma captura real foi fornecida. Fontes e datas acompanham o artigo. Recomendações ainda não têm rotas: relação de produto é validada, mas não gera CTA sem módulo pronto. Artigos relacionados usam categoria/tags, sem forçar compra.
- Backlog/outlines em docs; dois rascunhos locais draft com autor proposto e fonte também draft. Consulta Microsoft sustenta trechos de escopo/conta, sem experiência pessoal, benchmark, preço ou teste alegado. Checklist editorial humano e registro de correções são distintos de validação técnica.
- `test:blog-export` cria projeto temporário em /tmp com fixtures, executa build webpack isolado e remove o temporário. `--preview` copia somente esse export demonstrativo para `output/blog-preview`, ignorado por Git e lint; jamais alimenta `out/`. Produção permanece sem artigo aprovado.

## Etapa 04 — Catálogo editorial e recomendações — 21/10/2026

- Sem novas dependências. Next 16.4.2/React 19.3.1 e lockfile preservados; apenas script npm adicional. UI usa seleção nativa e estado local para filtros combinados; HTML inicial contém todo o catálogo aprovado, sem fetch remoto, carregamento artificial ou páginas por combinação.
- Contratos Product ampliados com specs discriminadas mínimas para mouse, teclado, headset, webcam, hub, roteador e monitor. Storage contempla SSD/externo sem presumir compatibilidade. ReviewClaim acrescenta resumo, usos e alternativas; publicação exige aprovação em todos os métodos. Somente hands-on confirmado recebe “Uso e recomendo”. Oferta acrescenta ordem editorial e lastLinkCheck; defaults conservadores mantêm leitura de cadastros anteriores, mas não tornam um link sem conferência acionável.
- Catálogo recomenda apenas produtos publicados com avaliação aprovada. Produto arquivado previamente aprovado mantém detalhe e referências de artigos, sai da listagem e perde todas as ofertas. Fontes publicadas, aprovação e verificação permanecem obrigatórias; archived não vira atalho de publicação. Um slug reservado é removido pelo finalizador no catálogo vazio, como no blog.
- Dados inválidos interrompem validate/build com erro; falha cliente usa o error boundary existente. Não ocultar erro editorial como ausência legítima. Não há operação de rede assíncrona na listagem nem necessidade de spinner.
- Preço só pela política já implementada de feed autorizado e com validade. Sem evidências atuais, ofertas reais permanecem vazias e afiliados desligados. Conferência de links é manual; export requer reconstrução após revisão e não promete validade em tempo real. Ausência de lastLinkCheck, data futura ou conferência anterior à revisão desabilita CTA com estado “Link a revisar”. Produtos arquivados não mantêm CTA.
- Evento de saída: suporte mínimo no-op desta etapa, payload restrito a productId/merchant/placement, sem URL/tracking, sem rede ou persistência. Exceções do observador não impedem navegação nativa. Não executa a infraestrutura geral de analytics da etapa 08.
- Transparência /afiliados existente preservada como rascunho institucional e vinculada junto às ofertas; aviso contextual antes do primeiro link distingue comissão e link comum. Abas novas não são forçadas; links monetizados usam sponsored/noopener/noreferrer e URL sem modificação.
- Documentação oficial consultada nesta execução: [Static exports](https://nextjs.org/docs/app/guides/static-exports) e [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params). Server Components geram HTML no build; slugs públicos gerados a partir do repositório. Sem recursos de servidor ou serviço pago.

## 5A — PCs selecionados (21/10/2026)

Sem nova dependência ou mudança de lockfile. Contratos por categoria estendem Product compartilhado; configurações vivem em arquivo próprio, validado no mesmo comando de conteúdo. Motor puro e resolução serializável ficam em src/domain/pc; páginas são Server Components geradas no build, com as mesmas convenções de slug vazio/finalização do catálogo anterior. Referência oficial consultada: https://nextjs.org/docs/app/guides/static-exports (Server Components no build, generateStaticParams, sem dependência de servidor).

Layout reutiliza tokens escuro azul e largura de leitura: lista por uso, detalhe com motivos e findings em sequência; sem painel flutuante ou tabela larga no celular. Estados incluem texto, não apenas cor. Sem JS adicional para escolher peças na 5A. Flag pcConfigurations permanece false por falta de conjuntos reais revisados; /pcs é entrada editorial vazia, sem anunciar o montador. Flag pcBuilder permanece false e /pcs/montar não existe. Sem eventos de montador antecipados, persistência ou compartilhamento. Ver escopo técnico/energia/evidências em docs/editorial/pcs.md.

## Etapa 06 — Celulares (22/10/2026)

Sem dependências novas; lockfile preservado. Product ganha apenas categoria phone; especificações detalhadas ficam no contrato PhoneVariant, sem mapa livre e sem executar outros módulos. Dados locais vazios, aprovação humana e fontes por seção/campo exigidas na fronteira de leitura. Ofertas são explicitamente vinculadas por offerIds para evitar compra de memória/região diferente sob mesmo nome. Sem nota ou inferência de autonomia/qualidade; diferenças quantitativas de peso e armazenamento são descritivas.

Consultada a documentação oficial atual de [export estático do Next.js](https://nextjs.org/docs/app/guides/static-exports), compatível com Next 16.4.2 instalado: páginas/fichas no build; query string lida após hidratação, sem API route, servidor ou useSearchParams no build. Comparações arbitrárias são noindex; só fichas aprovadas entram no sitemap quando existir origem. Política temporal e links dependem de rebuild. Estados de carregamento de rede não se aplicam ao catálogo local; erro estrutural interrompe validate/build e boundary existente cobre renderização cliente. Flag phones true significa implementação técnica local, não aprovação de catálogo/publicação. Nenhuma aprovação preenchida ou conteúdo real inventado.

## Etapa 07 — Orçamentos locais — 22/10/2026

- Reutilizados React/Next estático, Zod e Vitest instalados, sem dependência nova ou alteração do lockfile. Não consome produtos/ofertas/PCs/celulares: somente tokens, navegação e contrato de persistência/centavos de 01. Catálogo de serviços opcional e sugestões não foram necessários ao MVP; formulário inicia vazio.
- Quote v1 em `src/domain/quotes/model.ts`: BRL, UUID local, timestamps ISO, draft/issued, revisão explícita, pessoas, contexto, itens, condições e acréscimo fixo descrito. Quantidade inteira em milésimos (1–1.000.000), unitário e desconto fixo até 100.000.000 centavos, percentual 0–10.000 basis points. Cálculos intermediários BigInt: arredondamento half-up por linha, soma, desconto percentual half-up sobre subtotal, desconto limitado ao subtotal, acréscimo depois. Não há impostos ou preços inferidos. Totais permanecem inteiros seguros.
- Textos curtos até 160 caracteres, longos até 2.000, até 40 itens, 20 documentos no dispositivo; importação até 512.000 bytes. Objetos strict, IDs de itens únicos, versões incompatíveis/HTML/controles/propriedades extras rejeitados; texto renderizado por React, nunca HTML. Arquivo se chama `orcamento.json`, sem PII no nome. Schema externo é validado antes de substituir o formulário e substituição exige confirmação.
- Memória por padrão. Acesso ao localStorage somente em ações explícitas (listar/salvar/emitir/excluir); sem autosave. Salvar rascunho incompleto é permitido; revisão exige número, prestador/contato, cliente, itens com descrição/unidade/origem e descrição do acréscimo quando aplicável. Storage bloqueado/quota/corrupção não apaga dados nem bloqueia exportação. Carregar restaura também o estado de digitação numérica. Exclusão individual/todos e substituição usam confirmação contextual com foco.
- Emitir grava snapshot local; editar muda para draft e incrementa revisão. Snapshot emitido existente não pode ter conteúdo regravado por importação. Limite inclui snapshots e rascunhos. Sem validade jurídica especial.
- PDF pelo navegador com `window.print()`, CSS de mídia print e página nomeada A4 com margem 16mm, cores claras, thead repetido, linhas protegidas de quebra e condições com texto fluido. Regras globais de impressão limitadas à página de orçamentos. Marca, navegação, formulário, banners e controles ausentes do documento. Não há gerador PDF remoto.
- Referências oficiais consultadas em 22/10/2026: [MDN — Window.print](https://developer.mozilla.org/en-US/docs/Web/API/Window/print), [MDN — Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API). Tratamento por try/catch inclui acesso e gravação, sem presumir disponibilidade pela presença da API.

## Etapa 08 — 22/10/2026

Sem novas dependências. Métricas strict com Zod existente; no-op e debug exclusivamente local em desenvolvimento, sem transporte. Contratos aceitam só IDs controlados/enumerações; programa tem id distinto do nome da loja para evitar texto livre nos eventos. Views usam ref por montagem/ID; ações são emitidas em handlers. AdSlot inerte por padrão, preview de reserva 280px; integração real deliberadamente depende de trabalho posterior após aprovação/CMP. Programa afiliado exige canal, hosts, datas e divulgação revisados além da flag; links comuns preservados. Autorização de preço existente permanece separada da aprovação comercial de afiliados. SEO tem gate editorial de indexação além de origem; páginas institucionais só entram no sitemap após aprovação explícita. Fontes e operação em docs/ativacao-monetizacao-seo.md. Sem structured data comercial ou ratings.

## Etapa 09 — Operação editorial local (22/10/2026)

- Preservados schemas e repositórios públicos dos módulos; responsáveis/revisores/próxima revisão ficam em `docs/editorial/controle.json`, registro operacional validado junto ao build, sem poluir os contratos de produto/variante ou expor notas internas. Campos de datas/fontes existentes continuam canônicos; não duplicar aprovações no controle.
- Cadastro inicial gera apenas artigo draft usando templates externos a src. Sem CSV, CMS, painel, coleta, scraping, serviço ou dependência nova; demais registros usam JSON tipado e os templates documentados. Nenhuma instalação/alteração de lockfile necessária. APIs já instaladas de Zod/React Markdown/Node utilizadas; não houve configuração de fornecedor ou API externa dependente de versão.
- Auditoria de links usa o parser Markdown existente, reconhece referências e ignora código. Mesmo conjunto de destinos do renderizador: HTTPS sem credenciais, caminhos absolutos internos e âncoras. Arquivos locais exigem existência; rotas dinâmicas exigem registro publicado. Âncoras e disponibilidade de hosts externos ficam para revisão manual, sem crawler. Imagens Markdown bloqueadas até contrato de direitos, coerente com o aviso já presente no renderizador. Product.images preserva contrato de licença/arquivo existente; validade jurídica da permissão é humana.
- Controle exige proprietário para todos os artigos/produtos, revisor real nos publicados e integridade de IDs; não atesta que a revisão ocorreu. Marcadores de template impedem publicação. O exercício substitui datas/revisores somente em /tmp como fixture, sem registrar aprovação real. Build não autoriza deploy.

## 22/10/2026 — Validação 10A e preview local

10A limitada ao núcleo; 10B não indicada. Acrescentados auditor offline de HTML com Python stdlib e preview somente loopback, sem nova dependência/lockfile. Preview usa 404 do projeto e MIME real, sem listagem de diretório; não é host de produção. Termos corrigidos para mencionar uso local de orçamentos já implementado, mantendo rascunho. Git não reconhecido permanece bloqueador operacional, sem inicialização automática. Instruções portáveis e alternativa Nginx em docs/lancamento-10a.md; provedor específico depende de escolha/termos reais. Nenhuma política comercial ou aprovação editorial é inferida. Fontes oficiais atuais Next/Nginx/MDN consultadas e vinculadas no relatório. Lighthouse não instalado; nenhum dado de dependências enviado a registry para auditoria remota.


## 23/10/2026 — Identidade definitiva SilfonTech

Proprietário definiu SilfonTech como nome do blog e solicitou adaptação de toda a estrutura. Esta decisão substitui as referências históricas à marca provisória Portal Tech. Identidade centralizada em src/config/brand.ts; site/painel, metadados, ícones, capa, pacote npm, planos e documentação operacional atualizados. Registros anteriores deste documento e do progresso preservam a cronologia. Repositório GitHub continua JVsilveira/blog e o diretório local permanece no caminho autorizado existente; não foi presumido domínio, registro de marca ou conta externa nova.

Novos salvamentos locais usam namespaces silfontech; leitura das chaves anteriores mantém orçamentos, seleções PC e idioma sem gravação automática. Exclusão explícita de orçamentos/seleção remove ambas as chaves para impedir retorno do legado. Não altera versão/formato dos documentos, permissões, OAuth, sessões, referências Icecat ou links de afiliado.

## 23/10/2026 — Painel editorial gratuito no Cloudflare

Autorizado Workers + D1 para a administração online, mantendo o site público estático no Pages. Fonte de produção dos artigos passa ao D1; exportação de build autenticada e publicação via deploy hook privado. Sem login de leitores ou contratação de plano pago. OAuth/validações e UI compartilhados com o painel Node, que permanece para catálogo Icecat/Mercado Livre. Detalhes no ADR do plano 01 e docs/editorial/painel-cloudflare.md.
