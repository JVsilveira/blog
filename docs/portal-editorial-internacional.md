# Notícias, opinião e edições internacionais

Escopo autorizado em 22/10/2026: ampliar o SilfonTech para notícias e opinião sobre política, esporte, economia, tecnologia e outros temas, com português, inglês e espanhol. A marca SilfonTech está centralizada em src/config/brand.ts e consumida por src/config/site.ts. Não foram criadas notícias ou opiniões reais; rascunhos existentes continuam privados.

## Publicação e editorias

No painel, escolher Tipo de publicação: Notícia e opinião ou Blog e guia. A primeira opção cria um artigo de opinião baseado em notícias, sem exigir separar reportagem e opinião em áreas diferentes. Registros antigos do tipo notícia continuam válidos e aparecem na mesma seção. Categoria continua editável, com sugestões Política, Esporte, Economia, Tecnologia, Cultura, Mundo e Ciência. Fontes, autoria, método, limitações e aprovação humana continuam obrigatórios para publicar. Opinião recebe identificação e aviso explícitos no artigo; não é apresentada como relato factual neutro. Notícias usam NewsArticle, opinião OpinionNewsArticle e blog BlogPosting nos dados estruturados, sem prometer inclusão no Google News.

Conteúdo antigo sem kind é tratado como blog. Guias mantêm /ajuda/slug/. Notícias e opinião usam /publicacoes/slug/. /noticias/ reúne notícias e opiniões; /blog/ mantém os guias. /opiniao/ permanece como endereço compatível da lista conjunta, com canonical para /noticias/. O mesmo vale para /en/opinion/ e /es/opinion/, com canonical da edição news. Editorias em /editorias/politics/, /editorias/sports/, /editorias/economy/ etc. usam rótulos em português; os identificadores dos caminhos são estáveis. Ferramentas técnicas anteriores permanecem acessíveis em português pelo rodapé e pela navegação de ferramentas.

## Destaques e categorias

A página inicial privilegia notícias/artigos de opinião, sem texto de apresentação enumerando os temas. A primeira notícia tem título maior. Ordem de destaque no painel aceita inteiro de 1 a 99999: números menores aparecem primeiro, campo vazio segue depois dos destaques por data de publicação decrescente. Empates usam data e slug. Notícias e opinião precedem guias na home; cada seção respeita a mesma ordenação. Limpar o número remove o destaque. Alterar só a ordem não muda o texto traduzido nem exige revisar traduções novamente.

Categoria é editável com sugestões e reaproveitamento das categorias já cadastradas. O leitor escolhe uma categoria no filtro; somente categorias de artigos disponíveis na edição/lista são oferecidas, inclusive personalizadas. Categoria e busca podem ser combinadas, com contagem anunciada e botão Limpar filtros. Filtros não enviam dados nem criam páginas indexáveis para combinações; links de todos os artigos são entregues no HTML sem JavaScript, enquanto o filtro interativo requer JavaScript.

## Idioma do visitante

Português usa a raiz /; inglês /en/; espanhol /es/. Cada edição tem HTML, navegação editorial, metadados, fontes de interface e títulos de página no idioma correspondente. Layouts raiz separados por route groups produzem html lang correto sem mudar as URLs anteriores. O 404 global é independente dos layouts e o host deve servi-lo com HTTP 404 real.

Na primeira entrada pela raiz, com JavaScript, o navegador escolhe a edição a partir de navigator.languages, seguindo a ordem das preferências e considerando en-GB/en-US, es-MX/es-ES e pt-PT/pt-BR. Idiomas não atendidos usam português. A escolha manual é guardada somente no navegador. Links diretos das edições e artigos não são redirecionados por preferência. Sem JavaScript, a raiz mostra português e links para as outras edições.

Isso não é geolocalização por IP: país não determina uma única língua. Nenhuma consulta de país, API de geolocalização ou cookie de rastreamento foi adicionada. O comportamento automático se limita à entrada pela raiz; um visitante sempre pode trocar o idioma. Em artigo, o seletor oferece somente traduções efetivamente disponíveis; nas listagens, leva à seção equivalente.

## Traduções reais, com revisão

Em Versões internacionais no editor, adicionar inglês/espanhol e preencher título, resumo, corpo Markdown, método e limitações. A tradução é um texto editorial completo, não uma troca visual dos rótulos. Revisar e marcar a aprovação de cada idioma antes de salvar. A aprovação do original continua separada. Não há tradução automática em cada visita nem requisição ao Gemini para traduzir; a IA de sugestões de títulos continua independente.

Versões em draft, incompletas ou sem revisão não aparecem no site público. Tradução aprovada guarda a versão/data do original a que se refere. Ao alterar título, corpo, editoria, tipo, autoria, método, limitações, tags ou fontes do original pelo painel, suas traduções voltam a draft, salvo nova aprovação explícita. Alterar somente uma tradução não invalida a outra quando o texto original é igual. A fronteira pública também exclui versões com sourceUpdatedAt diferente de updatedAt, cobrindo arquivos editados fora do painel.

Não há fallback que apresente português como tradução inglesa/espanhola. Uma edição pode ter menos publicações enquanto traduções aguardam revisão. Ausência de versão retorna 404 na URL de artigo correspondente. Fontes e nomes próprios conservam sua identidade; categorias padronizadas têm rótulos traduzidos. As ferramentas especializadas de PCs/celulares/orçamentos e as páginas institucionais completas continuam em português, identificadas como tal quando acessadas das outras edições.

## Busca e indexação internacional

Cada artigo traduzido tem canonical próprio. hreflang e sitemap indicam apenas versões públicas, revisadas e sincronizadas; as versões referenciam suas equivalentes e a home usa x-default para a raiz. Artigos continuam legíveis no HTML sem JavaScript; a busca local filtra título, resumo e editoria sem transmitir os termos. As listagens editoriais renderizam todos os seus links no HTML inicial. Notícias e opinião não são duplicadas como guias em /ajuda/.

Ainda não há domínio configurado e a indexação permanece bloqueada. No lançamento, configurar origem HTTPS real e revisar as rotas de site.seo.approvedPaths, incluindo /en/ e /es/ quando aprovadas. Não criar canonical para domínio inventado. O alcance global depende de hospedagem pública, conteúdo útil, fontes, traduções, revisão e distribuição; não há garantia de ranking, tráfego ou citações de IA.

## Operação e validação

npm run admin:build gera o painel. npm run build gera as edições públicas. A geração pelo painel usa o mesmo export; não faz deploy. npm run test:blog-export -- --preview usa somente fixtures isoladas e pode gerar output/blog-preview; esse preview nunca deve ser publicado como conteúdo real. npm run seo:check inspeciona o artefato atual.

Referências oficiais consultadas em 22/10/2026:

- [Google: sites multilíngues e multirregionais](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: versões localizadas/hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: dados estruturados de artigos](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Schema.org: OpinionNewsArticle](https://schema.org/OpinionNewsArticle)
- [Next: route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next: 404 global](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
