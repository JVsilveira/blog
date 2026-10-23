# SilfonTech

Primeira versão do portal de notícias, opinião e guias, com ferramentas de TI, comparadores de celulares/tablets, processadores e memória RAM. Site público em Next.js com export estático e painel editorial Node separado, autenticado por Google OAuth. Português, inglês e espanhol nas áreas com tradução implementada.

## Iniciar a partir do GitHub

Requisitos: Node >=22.12 <27 e npm >=10 <13. Execute `npm ci`, copie `.env.example` para `.env.local` e execute `npm run dev`. Para gerar a versão pública, use `npm run build`; o resultado fica em `out/`. `npm run serve:export` oferece preview local com Python 3 em http://127.0.0.1:4173.

Para o painel, copie `admin/.env.example` para `admin/.env.local`, configure Google OAuth/allowlist/raiz persistente e execute `npm run admin:build` e `npm run admin:start`. Tokens somente no ambiente privado do servidor. Configuração: [painel editorial](docs/editorial/painel-google-oauth.md).

O catálogo técnico, índices, fotos Icecat e sessões são dados de execução e não são enviados ao GitHub. Um clone novo começa com catálogo vazio e funcional; configure Icecat no servidor para a carga automática. O catálogo local existente permanece preservado. Operação e limites: [comparadores e fontes](docs/comparadores-e-fontes.md).

O push do código não publica o site. A hospedagem pública deve servir `out/` e receber as atualizações de conteúdo; o painel/scheduler precisa de Node ativo e disco persistente. Publicar somente o front estático não mantém login, editor, Gemini ou sincronização funcionando. A origem HTTPS real, o callback Google e o fluxo de publicação precisam ser configurados na hospedagem. Nenhum serviço pago é habilitado por este repositório.

A vitrine Mercado Livre está vinculada; a importação dos produtos e o ranking real ainda dependem de autorização da API e de links individuais/feed autorizado da vitrine. Os dois artigos existentes continuam como rascunho, sem publicação automática.

Validação: `npm run typecheck`, `npm run admin:typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run smoke` e `npm run audit:export`.

## Histórico do planejamento

Os documentos abaixo registram a evolução do projeto. Estados de implementação e restrições históricas correspondem à etapa indicada; o estado atual está no início deste README e em [docs/progresso.md](docs/progresso.md).

### Planejamento inicial

Planejamento e base técnica local da etapa 01; o portal editorial completo ainda não foi implementado. Elaborado para João, em pt-BR. Marca SilfonTech definida pelo proprietário; domínio ainda pendente. Objetivo: portal de suporte e escolhas de tecnologia, começando com custo financeiro próximo de zero, monetizado por afiliados e futuramente anúncios.

## Como usar
1. Copie este diretório para a raiz de um repositório novo ou coloque os planos/prompts em diretórios equivalentes; preserve os caminhos ou ajuste todas as referências. O AGENTS.md deve ficar na raiz que rege o código. Se já existir, integre sem apagar regras anteriores.
2. Leia `planos/00-diretrizes-gerais.md`. Ele define produto, aparência, confiança e qualidade. Leia `01-arquitetura-e-dados.md` para contratos compartilhados.
3. Abra o prompt da etapa em `prompts/`, copie o bloco e execute com os arquivos disponíveis ao agente. Cada prompt manda ler seu plano completo; não depende do histórico do chat.
4. Execute uma etapa por vez e revise os critérios de aceite. O agente deve atualizar docs/progresso.md. Sem conteúdo verificado, publique menos páginas ou mantenha o módulo desligado; nunca use mocks como catálogo real.
5. Este pacote autoriza planejamento e implementação local, não publicação, compra ou cadastro externo automático. Solicite deploy depois de revisar o resultado concreto.

## Ordem recomendada
00 regras → 01 arquitetura → 02 visual → 03 blog → 04 recomendações → 08 monetização inativa/SEO → 09 operação → 10A validar núcleo.
Depois: 05A configurações PC → 05B montador → 06 celulares → 07 orçamentos → 10B validar cada ferramenta. A ferramenta de orçamentos pode ser antecipada se houver demanda de técnicos, mas não bloqueia o núcleo.

## Índice dos planos
| Arquivo | Conteúdo |
| --- | --- |
| 00-diretrizes-gerais.md | Regras de IA, público, identidade azul escura, acessibilidade e confiança |
| 01-arquitetura-e-dados.md | React/TypeScript, Next estático, schemas, conteúdo e persistência |
| 02-fundacao-visual.md | Home, navegação, componentes e institucionais |
| 03-blog-suporte.md | Artigos, busca, categorias e fluxo editorial |
| 04-recomendacoes-afiliados.md | Recomendações pessoais, catálogo e ofertas |
| 05-pcs-configuracoes-e-montador.md | Configurações prontas e motor de compatibilidade |
| 06-comparador-celulares.md | Variantes, comparação e recomendações fundamentadas |
| 07-orcamentos-ti.md | Atendimento, cálculos, dados locais e impressão/PDF |
| 08-monetizacao-seo-metricas.md | Afiliados, AdSense desligado, SEO e eventos sem PII |
| 09-operacao-editorial-e-dados.md | Cadastro, validação, revisão e distribuição |
| 10-validacao-lancamento-roadmap.md | QA, esforço, lançamento e decisões de evolução |

Cada plano possui prompt de mesmo nome. `prompts/EXECUTAR-5B-MONTADOR.md` complementa a execução do montador livre. `FONTES-E-DECISOES.md` registra referências e pendências externas.

## O que não estamos prometendo
Gratuidade permanente de terceiros, aprovação de afiliados/AdSense, renda em prazo definido, catálogo universal, preço mais baixo ou compatibilidade absoluta. O diferencial desejado é curadoria própria, explicações claras e ferramentas confiáveis. Não automatizar publicação de recomendações sem evidência.

## Executar a base local

Node >=22.12 <27 e npm >=10 <13; verificado com Node 26.12.0 e npm 12.2.1.

```sh
npm ci
npm run dev
```

Validações reais, após instalar dependências:

```sh
npm run validate:content
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
npm run serve:export
```

O último comando exige Python 3 e serve o export em http://localhost:4173. Build e checks funcionam offline após instalação. Estratégia de conteúdo, imagens, rotas futuras e hosting em [docs/arquitetura.md](docs/arquitetura.md). Estado e limitações em [docs/progresso.md](docs/progresso.md).

## Blog local — etapa 03

Acesse `/ajuda/`. Apenas artigos publicados e aprovados entram em HTML, categorias, paginação e busca. Atualmente há dois drafts e zero publicados. Pautas/outlines: `docs/editorial/backlog.md`; revisão e distribuição proposta: `docs/editorial/rascunhos.md`. Formato e checklist: `src/content/articles/README.md`.

Validação: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke`. Use o script build completo: ele valida dados e remove caminhos de contingência exigidos pelo export vazio do Next. Após instalar dependências, esses checks não precisam de rede.

`npm run test:blog-export` testa um export temporário com fixtures (webpack para isolamento de node_modules). Opcional `-- --preview` gera demonstração em `output/blog-preview`, nunca no export público `out/`. O preview só serve para revisão local; não publicar. O renderizador Markdown é a única dependência direta adicionada.

Origem de produção ausente: canonical/JSON-LD absoluto omitidos, sitemap vazio, robots bloqueado e noindex. Não houve deploy; artigos, textos institucionais e lançamento aguardam revisão humana.

### Catálogo editorial (etapa 04)

`/recomendacoes/` filtra por uso, categoria e método. Cadastros e os dez espaços de curadoria estão documentados em [docs/editorial/catalogo.md](docs/editorial/catalogo.md). Nenhum produto real aprovado foi fornecido; produção mantém catálogo vazio e monetização desligada. Arquivados preservam URL histórica e removem ofertas.

`npm run test:recommendations-export -- --preview` verifica HTML em build temporário isolado e gera `output/recommendations-preview` apenas para revisão sintética. Nunca publicar esse preview. `npm run build` e `npm run smoke` verificam o export real; não usar somente `next build`, pois o finalizador remove os caminhos reservados do catálogo vazio.

### Comparador de celulares — etapa 06

`/celulares/`, fichas estáticas de variantes aprovadas e `/celulares/comparar/?modelos=id1,id2` estão implementados. Catálogo real vazio aguardando curadoria. Cadastro, fontes por campo, aprovação e ofertas opcionais: [docs/editorial/celulares.md](docs/editorial/celulares.md). Teste isolado: `npm run test:phones-export -- --preview`; fixtures ficam em `output/phones-preview`, nunca em `out`. Sem nova dependência, nota automática ou serviço externo.

### Validação e lançamento — 10A

`npm run audit:export` audita links, âncoras e recursos HTML do export sem rede. `npm run serve:export` oferece preview em **http://127.0.0.1:4173**, com 404 do projeto e acesso somente local. Build anterior obrigatório. Relatório, limites, bloqueadores, roteiro de deploy/rollback e experimento: [docs/lancamento-10a.md](docs/lancamento-10a.md). Núcleo em revisão local, **não publicável e não publicado**; nenhum conteúdo ou integração recebeu aprovação automática.

## Área editorial com Google OAuth

Painel Node separado em `admin/` com postagens, prévia Markdown, fontes, autoria e geração da versão pública. Configure no servidor `admin/.env.local` a partir de `admin/.env.example`; vazio bloqueia login. Use `npm run admin:dev`, ou `npm run admin:build` e `npm run admin:start`. O portal público continua estático. Requer disco persistente, Google OAuth configurado e HTTPS remoto; somente contas da allowlist entram. [Configuração, arquitetura e limites](docs/editorial/painel-google-oauth.md). Segredos ficam no servidor, nunca em `NEXT_PUBLIC_` ou no chat. Não houve implantação remota nem autenticação com conta real.

Para preparar indexação, metadados e descoberta em buscas com IA, consulte [SEO e descoberta](docs/seo-e-descoberta.md). Configure a origem pública real somente após definir domínio/hospedagem; `npm run seo:check` inspeciona o export atual.

Notícias, opinião e idiomas pt/en/es: [operação editorial internacional](docs/portal-editorial-internacional.md).

Comparadores, fontes e importação: [Ferramentas TI e APIs](docs/comparadores-e-fontes.md).
