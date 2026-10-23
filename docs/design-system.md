# Design system do SilfonTech

Base implementada em 22/10/2026; paleta clara adotada na mesma data após autorização do proprietário. Referência visual: [Ghost Source](https://github.com/TryGhost/Source), especialmente [variáveis, layout e controles](https://github.com/TryGhost/Source/blob/main/assets/css/screen.css). O Source é um tema Ghost/Handlebars; este projeto mantém Next.js, CSS Modules e componentes nativos existentes.

## Direção

Publicação brasileira de tecnologia prática para consumidores, estudantes e pessoas em home office, com ferramentas próprias para técnicos. Clareza para quem está começando e densidade suficiente para quem precisa comparar dados. A identidade está na hierarquia editorial e no azul usado com moderação.

Do Source aproveitamos hierarquia tipográfica, espaços fluidos, conteúdo centralizado, listas editoriais com divisórias e superfícies discretas. Adotamos a direção clara com azul autorizada pelo proprietário, com fundo branco, superfícies azuladas sutis e texto azul profundo. Fonte de sistema, textos, rotas, fontes editoriais e estados de indisponibilidade permanecem os mesmos. Não importamos templates, scripts, fontes ou marca do Ghost. Código próprio; se houver incorporação futura de trechos substanciais do Source, acompanhar com a licença MIT e o aviso da Ghost Foundation.

A paleta clara foi escolhida como direção editorial para páginas de leitura, formulários e comparação. É uma decisão de design, sem alegar preferência universal ou pesquisa com usuários. O azul continua identificando links, ações e foco; estados recebem cores próprias e texto. Cards iguais para todas as seções foram evitados: listas usam divisórias, notas usam superfície e ferramentas mantêm seus controles nativos.

## Segunda referência: Smashing Magazine

[Smashing Magazine](https://www.smashingmagazine.com/), consultada em 22/10/2026, complementa o Source com navegação cromática forte, acesso por assuntos, hierarquia de artigos e contraste entre títulos sem serifa e texto editorial serifado. A composição foi analisada no navegador; nenhum texto, ilustração, fotografia, fonte proprietária ou código da referência foi importado.

Adaptação no SilfonTech:

- Cabeçalho azul #174A93 com texto e foco brancos; hover #123D7A. Os tokens `--header-background`, `--header-text`, `--header-hover` e `--focus-inverse` isolam a superfície inversa dos controles do dialog, que continua claro.
- Os dois caminhos existentes recebem superfícies azuladas e áreas clicáveis amplas, mantendo rótulos e destinos.
- Busca existente agrupada em painel próprio, com label e feedback visíveis. Não há uma segunda busca nem mudança no carregamento do índice.
- Categorias reais da listagem recebem etiquetas clicáveis com quebra de linha. Sem catálogo publicado, não são inventadas categorias para preencher a interface.
- Listagem de artigos mantém divisórias e dá mais hierarquia ao primeiro título. Texto do corpo do artigo usa `--font-editorial` (Georgia local, com fallback Times New Roman/serif); títulos continuam na fonte de sistema e código permanece monoespaçado.

A sobriedade, o respiro e a base clara do Source permanecem. A personalidade entra na navegação e na organização da leitura. Os componentes e a disponibilidade de conteúdo continuam definidos pelo SilfonTech.

## Fundação e uso

`src/styles/tokens.css` é a fonte única dos tokens globais, importada por `src/app/globals.css`. Os nomes existentes foram mantidos para compatibilidade com os módulos. Não duplicar cores e medidas sem necessidade; consumir com `var(...)` em CSS Modules. Não adicionar biblioteca visual nem dependência de fonte remota.

| Papel | Token | Valor / regra |
| --- | --- | --- |
| Página | `--background` | #FFFFFF |
| Notas e campos | `--surface` | #F3F6FB |
| Superfície elevada | `--elevated` | #E8EFF8 |
| Texto principal | `--text` | #182335 |
| Texto secundário | `--muted` | #526176 |
| Divisória decorativa | `--border` | #DBE3ED; não delimita sozinha controles |
| Link | `--primary` | #1757B8 |
| Foco | `--focus` | #1D4ED8 |
| Botão primário | `--primary-solid`, `--on-primary` | #1D4ED8 / #FFFFFF |
| Hover e pressionado | `--primary-hover` | #1E40AF |
| Limite de controles | `--control-border` | #5E6D82 |
| Estados | `--success`, `--warning`, `--danger` | #166534 / #854D0E / #B42318, acompanhados de texto |

Tipografia: `--font-body` usa fonte de sistema sem downloads; `--font-editorial` usa Georgia local no corpo dos artigos, com fallbacks serifados. Corpo em `--text-body` (1,0625rem), leitura em `--text-reading` (1,125rem), introdução em `--text-intro` (1,1875rem), título fluido de 2rem a 3,5rem. Entrelinha de leitura 1,75; texto até `--reading-width` (72ch). Títulos alinhados à esquerda, sem caixa alta ornamental. Usar hierarquia HTML, não escolher heading só pelo tamanho.

Layout: `--content-width` 1280px; `--page-gutter` fluido de 16 a 48px; `--section-space` de 32 a 64px; `--layout-gap` de 24 a 48px. Espaçamentos fixos disponíveis em 4/8/12/16/24/32/48/64px. Home em duas colunas no desktop e uma no celular. Campos e botões com mínimo de 48px; links de navegação com mínimo de 44px. Raios: controles 12px, painéis 16px, padrão 12px; pill reservado a elementos que necessitem dessa forma.

## Componentes existentes

A API de `src/components/ui/index.tsx` foi preservada. Novas telas devem reutilizá-la antes de criar variantes.

| Componente / padrão | Uso |
| --- | --- |
| `Button` / `.button` | Ação principal; default, hover, pressionado, foco e disabled. Botão executa ação, link navega. |
| `TextLink` | Link de conteúdo sublinhado, cor azul e foco visível. |
| `Input`, `Select`, `Checkbox` | Label explícito e controle nativo. `aria-invalid="true"` recebe borda de erro; mensagem precisa existir e ser associada via `aria-describedby`. Não validar apenas por cor. |
| `Badge` | Metadado curto, nunca prova decorativa de confiança. |
| `Alert` | Aviso contextual; `urgent` apenas quando anúncio imediato for necessário. |
| `Disclosure` | Informação complementar com details/summary; conteúdo essencial fica visível. |
| `Breadcrumbs` | Localização com página atual identificada. |
| `EditorialCard` | Título acionável e descrição em lista com divisória, sem botões redundantes. |
| `ProductSummary` | Resumo factual existente, mantendo fontes e limitações. |
| `.panel`, `.reading-note` | Agrupamento de ferramenta e nota editorial, respectivamente. |
| `.phone-table-scroll` | Comparação com rolagem própria; sem estreitar dados até ficarem ilegíveis. |
| Menu móvel | Dialog existente com Tab contido, Escape e retorno do foco. |

O tema claro é o padrão; não há seletor de tema nem troca automática por preferência do sistema, rota pública de demonstração ou funcionalidade comercial. As classes de estados não substituem validação de formulário ou mensagens do domínio.

## Critérios para evoluir

- Verificar 320/360/390/768/1024/1440px, texto ampliado e ausência de rolagem horizontal global.
- Conferir foco, Tab, Shift+Tab e Escape; áreas roláveis mantêm acesso por teclado conforme o componente.
- Contraste mínimo pretendido: 4,5:1 para texto normal e 3:1 para limites essenciais e foco. Divisórias decorativas têm função distinta.
- Feedback de 150ms, sem animação de entrada; `prefers-reduced-motion` elimina transições. Forced colors conserva limites e foco do sistema.
- Nenhum dado sintético, preço, especificação ou depoimento na produção para preencher layout.
- Validar fixtures e páginas de detalhes separadamente quando o catálogo real estiver vazio.

Resultados desta implementação e limitações estão em `docs/progresso.md`. Isso é uma fundação de design; não equivale a certificação WCAG ou aprovação editorial.


## Identidade SilfonTech — 23/10/2026

Marca definida pelo proprietário. Nome, slug e desenho do monograma ST ficam em `src/config/brand.ts`, consumidos pelo site e pelo painel. Tema claro com azul preservado. Ícones públicos/editoriais usam ST em branco sobre #1757B8. Capa de compartilhamento 1200×630 em `public/og-blog.png`, com fonte vetorial editável `public/og-blog.svg`, reutilizando a descrição editorial e os tópicos já existentes. Domínio permanece pendente; não criar origem fictícia a partir do nome.
