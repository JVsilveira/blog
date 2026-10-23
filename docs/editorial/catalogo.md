# Cadastro e revisão de recomendações

Produção permanece sem produtos. Estes são 10 espaços de curadoria, **não produtos identificados nem recomendações**. Todos aguardam identidade/modelo exato, fonte oficial, especificações, contexto editorial e aprovação de João:

| Candidato | Categoria do contrato | Pendência específica |
| --- | --- | --- |
| Mouse | mouse | Conexão e lateralidade |
| Teclado | keyboard | Layout e conexão |
| Headset | headset | Conexão e microfone |
| Webcam | webcam | Resolução e conexão |
| Hub | hub | Conector, portas e energia; não presumir vídeo |
| SSD | storage | Interface, formato, capacidade e requisitos |
| Memória | ram | Tipo, kit, formato e perfis; não presumir compatibilidade |
| Roteador | router | Padrão Wi-Fi e portas |
| Monitor | monitor | Diagonal, resolução e entradas |
| Armazenamento externo | storage | Interface, formato, capacidade e requisitos |

## Template de cadastro (copiar só após obter evidências)

Em `src/data/catalog.json`, criar Product com id/slug estáveis, schemaVersion 1, status/editorialStatus **draft**, timestamps ISO reais, nome/marca/modelo confirmados, categoria e specs do schema. `null` significa desconhecido; listas vazias não demonstram compatibilidade. Não há preço estimado nem filtro de orçamento nesta etapa, pois não existe evidência aprovada.

Cadastrar SourceReference com URL HTTPS, publisher, accessedAt e scope específico; também draft enquanto não revisada. `sourceIds` deve apontar para essas fontes. Imagens: manter `[]` até haver ativo local autorizado; depois registrar src, alt, width, height e rightsSource e incluir o arquivo em public/images. Não usar fotos geradas ou de loja sem direitos.

Criar ReviewClaim: id, schemaVersion 1, status draft, createdAt, updatedAt, productId, method documental/editorial/hands-on, ownerApprovedAt null, summary, uses[], pros[], cons[], bestFor[], avoidIf[], alternativeProductIds[]. O resumo e os argumentos precisam ser reais, revisados e sustentados; uso pessoal só João confirma. Publicação exige resumo, usos, público, limitações e aprovação; produto e fontes também precisam estar aprovados/publicados. Uma avaliação pública por produto. Alternativas só aparecem se também possuírem avaliação pública aprovada; não basta cadastrar produto.

## Ofertas opcionais

Pode manter `offers: []`. Para cadastrar: campos do AffiliateOffer, destinationUrl HTTPS real, affiliateUrl apenas se fornecida pelo programa, enabled false até conferência, verifiedAt/lastLinkCheck ISO reais, sourceId, currency BRL, pricePolicy none, editorialOrder inteiro explícito (menor primeiro). Não cadastrar preço manual, cupom, estoque ou ID fictício. lastLinkCheck anterior à revisão editorial, ausente ou futura deixa o link indisponível. Conferência é humana, sem scraping ou requisição automática à loja. A validade é a do export: revisar e reconstruir antes de publicar e periodicamente.

Sem configuração comercial real, `site.features.affiliates` continua false. URLs normais não usam tracking. Não há cadastro de programa ou automação de monetização nesta etapa; ativação exige revisar regras do programa e transparência na etapa 08. Ordem de ofertas não deriva da comissão. Eventos de saída são no-op locais, sem rede/armazenamento, sem URL completa.

## Arquivamento

Após publicação, preservar o slug e mudar somente `Product.status` para archived, mantendo editorialStatus published, aprovação, fontes, verificação e ReviewClaim publicado. Detalhe histórico e relações de artigos continuam acessíveis; listagem e ofertas excluem o produto. Não apagar silenciosamente a orientação antiga. Registrar motivo/contexto no resumo e limitações, atualizar datas e revisar alternativas. Se a identidade/dados deixaram de ser confiáveis, retornar a draft (remove acesso público), sem fingir aprovação.

## Validação e preview

`npm run validate:content`, `npm test`, `npm run test:recommendations-export -- --preview`. Fixtures vivem em tests/fixtures; o último comando constrói em /tmp e copia apenas o preview sintético a output/recommendations-preview. Nunca publicar esse diretório. Build público usa somente conteúdo real aprovado; no estado atual, lista vazia intencional. Erros de contrato bloqueiam o build, não são ocultados como catálogo vazio.
