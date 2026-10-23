# 03 — Blog de ajuda, suporte e guias de compra

## Resultado e dependências
Depende de 02. Publicação editorial local com categorias coerentes, URLs estáveis e HTML estático. Categorias iniciais: Windows e computador, Internet e conectividade, Home office, Guias de compra. Linux pode entrar como especialidade se houver conteúdo real; não criar categorias vazias.

## Fluxos
Leitor chega por busca externa ou home → lê problema e solução → consulta passos e limitações → acessa tutorial relacionado ou recomendação pertinente. Listagem paginada, categorias e busca por título/resumo/tags. A busca tolera acentos e caixa e oferece limpar filtros; não precisa de serviço externo. Índice exclui rascunhos, dados de orçamentos e conteúdo demonstrativo.

## Template editorial
Título específico; resposta curta; pré-requisitos e contexto de versão; passos numerados; capturas próprias quando disponíveis; como verificar que funcionou; quando parar e buscar suporte; alternativas; fontes; revisão e autoria; recomendações relacionadas justificadas. Comandos destrutivos exigem explicação de efeito e backup adequado. Não publicar comandos supostamente testados sem teste. Guia de compra inclui critérios, cenários e limitações.

## Dados e conteúdo inicial
Implementar schema Article do plano 01 com body Markdown/MDX local confiável. Conteúdo publicado precisa ser revisado pelo proprietário. Entregar 8 pautas em backlog, outlines de 4 e até 2 rascunhos completos marcados draft: lentidão e SSD, monitores e adaptadores, headset para reuniões, hub USB-C, sinal Wi-Fi, backup, armazenamento externo e ergonomia de periféricos. Não fabricar volume de artigos para preencher layout. Fixtures demonstrativas em ambiente próprio; produção mostra só conteúdo aprovado.

## SEO e distribuição
Título e description únicos, canonical para URL de produção configurada, Open Graph com ativo autorizado, Article/Breadcrumb JSON-LD fiel ao conteúdo. Gerar sitemap apenas de publicados; robots condizente com ambiente. Sem páginas indexáveis por combinação de filtros. Links internos por intenção do leitor, sem forçar compra. Cada artigo recebe proposta de um vídeo curto e um post demonstrativo; não enviar automaticamente.

## Aceite e testes
Slug direto renderiza corpo sem JS; rascunho não acessível no export público. Busca encontra termos com acento removido e retorna estado vazio útil. Fonte ausente bloqueia afirmação técnica relevante na revisão. Testar slug inválido/404, relação de produto inexistente, índice e paginação. Sem schema de review/FAQ inventado para buscar rich results. Copiar código fornece feedback acessível sem alterar conteúdo.

## Métricas
Visualizações de artigo, busca realizada e resultado aberto sem registrar texto livre da busca. Artigo → clique em recomendação; crescimento de páginas úteis, não número bruto de publicações. Sem meta garantida de ranking ou AdSense.
