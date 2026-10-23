# Visibilidade em buscadores e respostas de IA

## Estado atual

O proprietário adquiriu silfontech.com.br em 23/10/2026. A origem pública está configurada como https://silfontech.com.br; hospedagem e apontamento DNS ainda pendentes. A versão local continua com noindex e robots bloqueando rastreamento; nenhum domínio fictício foi configurado. Os dois artigos reais permanecem rascunhos. As melhorias locais preparam o lançamento, não comprovam presença em buscadores ou respostas de IA.

## Configuração de lançamento

Copiar `.env.example` para `.env.local` na raiz, separado de `admin/.env.local`. Definir `NEXT_PUBLIC_SITE_URL` com a origem HTTPS real, sem caminho, parâmetros ou credenciais. Definir `NEXT_PUBLIC_SEO_APPROVED_PATHS` com páginas estáticas já revisadas, separadas por vírgula. Exemplos de rotas existentes: `/`, `/ajuda/`, `/sobre/` e `/metodologia/`. Não aprovar páginas institucionais com textos provisórios ou catálogos vazios apenas para aumentar o sitemap.

Somente no build destinado à publicação definir `NEXT_PUBLIC_SITE_INDEXING=true`. Origem sozinha não libera a indexação. Local e previews usam false; previews privados também precisam de controle de acesso no host. As variáveis são resolvidas no build: alterar arquivo exige gerar novamente o artefato. Rotas inexistentes, URLs de filtros e rotas privadas são recusadas na configuração. Os artigos publicados e aprovados entram automaticamente, sem aprovação manual de cada slug na variável. Fontes/autor/revisão continuam obrigatórios.

As páginas estáticas sem aprovação explícita recebem noindex e permanecem fora do sitemap. Categorias e paginação são geradas a partir dos artigos públicos; ferramentas de combinações arbitrárias mantêm noindex. Sem origem real, canonical e dados estruturados absolutos são omitidos.

No Google Search Console e Bing Webmaster Tools, cadastrar a propriedade real. Para verificação por meta tag, preencher respectivamente `GOOGLE_SITE_VERIFICATION` e `BING_SITE_VERIFICATION` com os tokens fornecidos e gerar novo build. A alternativa DNS é configurada no provedor. Não usar tokens inventados. Enviar `/sitemap.xml` pelos consoles após publicação. Essas ações externas ainda não foram realizadas.

Validação local:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run seo:check
# Usar no artefato destinado ao lançamento; retorna erro se houver pendências:
npm run seo:check -- --production
```

O auditor lê o HTML exportado, não o ambiente do terminal: avalia canonical, títulos/descrições distintos, título principal, presença no sitemap, bloqueio da home e existência de artigos indexáveis. Esse conjunto é uma verificação local parcial; não substitui inspeção de URL, Rich Results Test, avaliação editorial ou medição real. O build usa o mesmo processo quando iniciado pelo painel.

## O que o código fornece

- HTML estático legível sem executar JavaScript; artigos com passos, sumário, fontes, método, limitações e links relacionados já presentes no corpo.
- Títulos e descrições específicos, canonical por URL, Open Graph e Twitter Card. A imagem padrão é de compartilhamento do portal; não é apresentada como foto de produto ou evidência de teste.
- `BlogPosting` com autoria editorial, idioma, seção, datas reais e referências às mesmas fontes do texto; `BreadcrumbList` acompanha o caminho visível. `WebSite` identifica a home sem inventar credenciais, avaliações ou organizações.
- Previews amplos de snippets e imagens nas páginas indexáveis, respeitando as escolhas do mecanismo.
- Sitemap somente com conteúdo público aprovado e rotas permitidas. `lastModified` de conteúdo usa a data editorial, não uma data artificial a cada build.
- Após liberação, robots permite buscadores pela regra geral, inclusive OAI-SearchBot. O painel continua privado, separado e noindex; sua foto e e-mail Google não alimentam autoria pública nem dados estruturados do portal.

## Como escrever guias fáceis de encontrar e citar

No editor, o título identifica a dúvida real de quem pesquisa e o resumo explica o resultado e o contexto. Não há necessidade de campos separados ou repetição de palavras-chave. Manter uma intenção principal por artigo, em vez de várias páginas quase iguais.

Começar com uma resposta direta sustentada por fontes, dizendo para quem se aplica e as limitações. Depois desenvolver pré-requisitos, passos numerados, como confirmar o resultado e quando a orientação não resolve. Usar subtítulos descritivos que façam sentido isoladamente. Perguntas e respostas são úteis quando respondem dúvidas reais; não criar FAQs artificiais ou prometer destaque especial no Google.

Referenciar documentação original e evidências por afirmação relevante, com versões e datas quando necessário. Distinguir teste pessoal de análise documental. Atualizar data de revisão só após conferir e modificar ou confirmar substancialmente o conteúdo. Informações desconhecidas continuam desconhecidas. Biografia e qualificações públicas dependem de dados confirmados do proprietário; login Google não publica esses dados automaticamente.

Construir trilhas coerentes, como um guia principal de um problema e guias específicos que realmente o complementem. Adicionar links internos com rótulos que expliquem o destino e manter links/fontes válidos. Não gerar páginas repetidas por marca/cidade/pergunta sem informação adicional útil. Não produzir volume automático de texto para simular autoridade.

Priorizar utilidade, leitura mobile, carregamento rápido e imagens autorizadas quando contribuírem para a explicação. Não há um número mágico de palavras, artigos ou palavras-chave que garanta posição ou citação.

## Verificações no host e acompanhamento

Depois de escolher a hospedagem, conferir respostas HTTP 200 e 404 corretas, HTTPS, redirecionamento do host alternativo para o canônico, cache e ausência de noindex imposto por headers em produção. CDN/WAF não deve bloquear Googlebot, Bingbot ou OAI-SearchBot em páginas públicas; usar instruções oficiais de identificação, sem liberar a área privada. O robots local sozinho não altera o firewall do provedor.

Inspecionar a home e um artigo real no Search Console, testar dados estruturados, enviar sitemap e acompanhar páginas indexadas, impressões, consultas, cliques e CTR. No Bing, conferir rastreamento e sitemap. Comparar períodos após haver dados reais e priorizar melhorias em artigos que já respondem a consultas relevantes. Tráfego e citações dependem dos mecanismos; não são garantidos pela implementação.

A busca com IA usa parte da mesma base de descoberta: conteúdo acessível e confiável, contexto explícito e atribuição verificável. Não foi criado um arquivo especial `llms.txt` como promessa de ranking: o Google diz que não exige arquivos para IA nem schema específico. OAI-SearchBot controla descoberta na busca do ChatGPT; GPTBot tem finalidade de treinamento, uma decisão independente. Não é necessário contratar uma API de IA para ser encontrado.

## Referências oficiais consultadas em 22/10/2026

- [Google: recursos de IA e seu site](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: dados estruturados de artigos](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: conteúdo útil e confiável](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [OpenAI: crawlers e busca](https://developers.openai.com/api/docs/bots)

## Produção Cloudflare — atualização de 23/10/2026

Solicitação do proprietário autoriza preparar indexação das publicações. `npm run build` executa scripts/build-public.ts: em Pages (`CF_PAGES=1`) e branch `main`, define como padrão a origem real https://silfontech.com.br, indexação true e rotas editoriais. Respeita desligamento explícito por NEXT_PUBLIC_SITE_INDEXING=false. Variáveis explícitas de origem/rotas continuam aceitas. Branches de preview têm indexação forçada para false, mesmo que herdem true de produção. Builds locais continuam sem liberar indexação automaticamente. Node fixado em .node-version 24.15.0, compatível com o npm usado pelo projeto e já validado no build remoto.

Coleções de notícias/guias vazias não entram no sitemap; aliases de opinião apontam para Notícias e não criam entrada duplicada. Notícias publicadas preservam seu título no H1, title, Open Graph, Twitter e headline dos dados estruturados; autoria/datas/idioma/canonical/hreflang permanecem vinculados ao conteúdo real. Publisher identifica a publicação SilfonTech e sua marca, sem inventar foto editorial ou credenciais da autoria. Metadados de artigo não garantem escolha do mesmo título pelo Google nem posição nos resultados.

No estado atual só há dois rascunhos: build de produção torna as três homes indexáveis, mas não há notícias aprovadas para apresentar nas buscas. Publicar pelo painel e disponibilizar o export atualizado continua necessário. Depois de o domínio estar ativo, cadastrar a propriedade no Google Search Console/Bing Webmaster Tools, enviar https://silfontech.com.br/sitemap.xml e usar Inspeção de URL para a primeira notícia. Nenhum token de verificação foi inventado e nenhum rascunho foi publicado automaticamente.

Acesso universal não depende de uma opção de Chrome no aplicativo: o deploy é HTML/CSS/JS público. A rede consultada devolveu 127.0.0.1 para o host pages.dev, enquanto Google/Cloudflare DNS retornaram IPs legítimos e HTTPS validado respondeu 200. O domínio próprio permanece sem A enquanto o Registro.br está em transição. Concluir nameservers/Pages Custom domains/HTTPS, adicionar www com redirecionamento ao domínio raiz e manter páginas públicas sem Cloudflare Access ou desafio obrigatório. Manter Search/Agent permitidos no AI Crawl Control. Não há como o código garantir acesso contra bloqueios de provedor, firewall, extensão ou aparelho; trocar DNS no Chrome foi um diagnóstico/contorno local, não uma exigência do site.
