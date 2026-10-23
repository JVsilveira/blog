# Operação local e curadoria

Somente JSON/Markdown e Git quando disponível, sem serviço pago, painel remoto ou senha no cliente. João é o proprietário do portal; nomes no controle não comprovam revisão realizada. Conteúdo de clientes de orçamentos nunca entra nestes arquivos, capturas, logs ou commits.

## Tutorial: artigo sem editar TSX

1. Execute `npm run editorial:new -- meu-guia`. O comando cria `src/content/articles/meu-guia/article.json` e `body.md` em draft com datas reais de criação. Slug inválido, reservado ou existente é recusado; não sobrescreve. Não concede aprovação e não altera outros artigos. Se houver falha de escrita, corrija permissões/espaço e tente novamente.
2. Preencha os dois arquivos. Remova todos os marcadores PREENCHER. Use a estrutura de resposta, contexto, riscos, passos, resultado verificável, alternativas e limitações. Não descreva como testado o que foi apenas pesquisado.
3. Em `docs/editorial/controle.json`, adicione `{ "kind": "article", "id": "meu-guia", "owner": "responsável real", "reviewer": null, "nextReviewAt": null, "note": "Pesquisa pendente" }`. Proprietário é responsável pela manutenção; reviewer só recebe nome após revisão real. Próxima revisão aceita timestamp ISO opcional; não é alterada pelo rebuild. Registros duplicados, ausentes e órfãos bloqueiam validação. Use kind product para cada produto.
4. Cadastre fontes reais em `src/data/catalog.json`, coleção sources, a partir de `templates/editorial/source.json`; referencie os IDs em sourceIds. Identifique autor real em authors (João existente continua draft até confirmação). Não invente data de consulta. Novas fontes e autor começam draft.
5. Execute `npm run validate:content`. Corrija o caminho indicado pelo schema. Links Markdown locais devem apontar para rotas públicas existentes ou arquivos em public. Use caminhos absolutos `/ajuda/`, âncoras `#secao-2` ou HTTPS sem credenciais, conforme o renderizador existente. Links relativos, HTTP, mailto e queries no corpo não são suportados e falham com diagnóstico. Links para drafts não são públicos. O parser cobre links inline e por referência e ignora blocos de código. Consulta externa/HTTP não é feita: o check não comprova que uma fonte HTTPS continua online. Âncoras internas não são verificadas; confira-as no preview. Imagens Markdown são bloqueadas pois não possuem contrato próprio de direitos; não contorne com HTML.
6. Pesquisa → rascunho → revisão técnica → revisão de compra/afiliados se aplicável. Após revisão humana **real**, registre revisor no controle, fontes/autor aprovados como published, ownerApprovedAt real no autor e artigo, publishedAt real, status published e updatedAt da revisão. Fontes, riscos, método e limitações devem ser confirmados por João. Nunca use datas da fixture em conteúdo real. O comando de cadastro não publica automaticamente.
7. Execute `npm run validate:catalog`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke`. Sirva `npm run serve:export` e confira URL direta, HTML sem JS, teclado e mobile. Revisar diff e direitos antes de commit; build local não autoriza deploy. No checkout atual Git não é reconhecido: resolver versionamento/backup antes de operação pública, sem inicializar ou descartar arquivos automaticamente.
8. Correção relevante: registre slug/data/responsável/motivo/fonte em `docs/editorial/correcoes.md`, atualize updatedAt após revisão real e reconstrua. Arquivar artigo remove do público; referências para ele passam a falhar e precisam ser corrigidas. Para produto histórico, siga catalogo.md.

## Campos e templates

Templates em `templates/editorial` são esqueletos deliberadamente incompletos, fora de src. SUBSTITUIR/DATA_ISO/URLs não são dados válidos e devem ser preenchidos com evidência. Não copie templates inteiros para produção sem pesquisar. Nenhuma imagem ou preço fictício é fornecido.

| Arquivo / campos | Preenchimento |
| --- | --- |
| Todos JSON: schemaVersion, id, status, createdAt, updatedAt | versão 1; ID estável minúsculo com hífens; draft/published/archived; timestamps ISO com fuso; updatedAt representa revisão, não build |
| article: slug, title, description, authorId, category, tags | slug coincide com pasta; título/resumo únicos quando públicos; autor cadastrado, categoria editorial, tags reais |
| article: publishedAt, ownerApprovedAt | null até publicação/aprovação humana; datas reais, sem simular revisão |
| article: sourceIds, relatedProductIds, methodology, limitations | IDs existentes, método e ressalvas explícitos; corpo exclusivamente em body.md |
| source: url, publisher, accessedAt, scope, note opcional | HTTPS real, responsável pela fonte, consulta efetiva, campos sustentados; conflito/contexto em note |
| product: slug, name, brand, category, specs | modelo exato e categoria correspondente; template mouse é mínimo, demais categorias usam contrato em src/domain/schemas.ts |
| product: sourceIds, images, verificationStatus, verifiedAt, editorialStatus, ownerApprovedAt | fontes; images vazio até autorização; pending e datas null até checagem; publicação exige approved, datas e aprovação |
| image: src, alt, rightsSource, width, height | arquivo em public/images; descrição; URL da licença/autorização, dimensões reais. Guardar evidência de permissão e atribuição exigida; URL não prova direitos por si só |
| review: productId, method, ownerApprovedAt, pros, cons, bestFor, avoidIf, uses, alternativeProductIds, summary opcional em draft | documental/editorial/hands-on; experiência só confirmada por João. Publicação exige resumo, usos, público, limitações e aprovação |
| offer: productId, merchant, destinationUrl, enabled, verifiedAt, lastLinkCheck, editorialOrder, pricePolicy, currency, sourceId | manter disabled, none e BRL até conferência; sem preço; URL de afiliado opcional somente real/autorizada. Regras comerciais em ativacao-monetizacao-seo.md |

Para produto, copie product.json para a coleção products de catalog.json, preencha fontes, controle kind product e valide. source/review/offer vão para suas coleções correspondentes; ofertas e avaliações são opcionais. O build já usa os schemas de PC/celulares: cadastro específico segue pcs.md/celulares.md e contratos tipados, sem converter variantes numa ficha genérica. Não há import CSV; JSON preserva null, false e unidades explícitas (mm, g, GB, W, mAh, MT/s); não inferir conversões ambíguas ou compatibilidade. Datas não podem ser impossíveis; IDs e enumerações incorretos bloqueiam build. Dinheiro é centavos inteiros BRL, nunca preço manual de loja.

## Matriz de fontes e conflitos

| Evidência | Preferência / cuidados |
| --- | --- |
| Especificação e suporte | Fabricante e manual da variante exata; CPU exige matriz CPU/BIOS, não só socket |
| Ensaios comparáveis | Fonte independente com método/condições; não misturar testes diferentes num ranking |
| Uso pessoal | João confirma contexto e data; análise documental não vira hands-on |
| Celular por país/variante | Código do fabricante, região, memória, bandas, NFC/eSIM, carregador, garantia e política de updates precisam de confirmação específica |
| Peça por revisão | Revisão da placa/BIOS, kit de montagem, dimensões/conectores e compartilhamento de slots precisam de evidência própria |
| Conflito / fonte removida | Registrar as URLs, campos, versões e conflito na note; manter null ou voltar a draft até revisão. Não substituir por palpite |

## Rotina

Semanal: João/responsável no controle revisa links das páginas com visitas (quando houver métricas reais), relatos disponíveis, build e novas recomendações. Sem medição, usar lista de publicados; não inventar visitas. Conferir destinos externos manualmente, sem crawler de lojas. Verificar próximas revisões no controle e oferecer prioridade às vencidas.

Mensal: revisar modelos consultados, variantes, políticas comerciais e páginas institucionais conforme mudanças reais. Por evento: firmware/BIOS, suporte alterado, peça removida ou especificação corrigida exigem nova apuração e rebuild. Revogar publicação se não houver confiança. Backup versionado dos arquivos editoriais e teste de restauração local antes de lançamento; orçamentos privados ficam fora desse backup.

Para cada publicado, preparar roteiro: problema e contexto → demonstração autorizada → resultado e limitação → link permitido. Registrar ativo derivado, autor/licença/permissão e atribuição; sem autorização, não gerar/publicar imagem. Posts e mensagens permanecem drafts, sem envio. Só divulgar em canais permitidos pelo programa e comunidade, sem spam.

## Exercício seguro

`npm run test:editorial` cria diretório temporário, executa o cadastro real, comprova draft ausente do repositório público, recusa publicação sem aprovação, simula datas/revisor **sintéticos** somente nessa fixture e confirma exposição pública após validação. Também recusa sobrescrita, produto inválido e link local quebrado. Remove a fixture no finally; não muda src de produção nem concede aprovação editorial. `npm run test:blog-export` complementa com HTML/export de fixture isolada. Nunca publicar diretórios output/*-preview.

## Alternativa com interface e Google OAuth

A área editorial autenticada foi autorizada em 22/10/2026. Para editar por interface, configurar OAuth e gerar o artefato público, siga [painel-google-oauth.md](painel-google-oauth.md). As validações e a distinção entre aprovação, build e deploy deste tutorial continuam vigentes.
