# Conteúdo local

Artigos são diretórios com `article.json` (metadados do schema Article, exceto body) e `body.md` (Markdown confiável, sem HTML). Diretórios vazios não geram páginas. Consulte docs/arquitetura.md. Este README não é conteúdo editorial.

A etapa 03 lê todos os metadados para validar, mas apenas `published` com fontes, autor aprovado e ownerApprovedAt entra no export, índice, sitemap ou rotas. Os dois rascunhos atuais não possuem aprovação. Pautas e outlines ficam em `docs/editorial/backlog.md`; propostas de distribuição e revisão em `docs/editorial/rascunhos.md`.

Markdown CommonMark renderizado no build, sem MDX executável ou HTML bruto. Links no corpo permitem HTTPS sem credenciais e caminhos internos/âncoras; imagens no Markdown são substituídas por aviso até haver contrato de captura com direitos. Blocos de código possuem cópia cliente com feedback; não adicionar comandos não testados. Cabeçalhos de segundo nível formam o sumário, excluindo blocos cercados por fences. Use títulos de seção em texto simples.

Template de revisão: resposta curta; contexto de versão e pré-requisitos; passos numerados; como verificar; quando parar e procurar suporte; alternativas; método, limitações e fontes por afirmação relevante. Guia de compra exige critérios e cenários documentados. Data de revisão não muda automaticamente no build. O validador impede fonte ausente, mas a suficiência de cada fonte e a segurança do procedimento dependem da revisão humana, nunca de aprovação automática.

Após revisão de João: conferir referências publicadas, preencher publishedAt/ownerApprovedAt com evidência e datas reais, atualizar updatedAt, passar validate:content e build, revisar export. Isso não autoriza deploy. Origem permanece null e robots/noindex bloqueiam indexação até a etapa de lançamento.

Operação da etapa 09: `npm run editorial:new -- meu-guia`; tutorial e campos em `docs/editorial/operacao.md`, esqueletos em `templates/editorial`. Cada artigo/produto precisa de registro em `docs/editorial/controle.json`; validação do build verifica links locais e controle. `npm run test:editorial` exercita publicação exclusivamente em fixture temporária, sem aprovação real.
