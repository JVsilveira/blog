# Comparadores com catálogo automático Icecat

Atualizado em 23/10/2026. A pedido do proprietário, não há aprovação, preenchimento manual nem geração do site por produto.

## Uso

Entrar no painel Google OAuth e abrir **Produtos e comparadores**. A tela tem um botão **Atualizar catálogo agora** e contagens de celulares, processadores e memória RAM. As fichas entram automaticamente nas três ferramentas. Buscar por nome/código no comparador e selecionar de dois a três modelos. Todas as especificações recebidas são comparadas, preservando campos desconhecidos.

## Sincronização

- Índice inicial completo Open: `https://data.icecat.biz/export/freexml/EN/files.index.xml.gz`. A leitura é em streaming/gzip e retém só categorias 1893, 989 e 911. Sem limite comercial de dois modelos por categoria ou de dez modelos no catálogo. Proteções de processamento: 600 MB comprimidos, 6 GB expandidos, 500 mil referências nas três categorias, 20 minutos para o índice; erro preserva cache anterior.
- Índice completo é refeito a cada 30 dias; delta oficial `daily.index.xml.gz` é mesclado a cada 24 horas, sem perder modelos ausentes no delta. Remoções explícitas são arquivadas.
- `ICECAT_AUTO_SYNC=true`: servidor Node verifica a fila a cada minuto e começa após 3 segundos. Cada ciclo carrega até 100 fichas, alternando categorias. Não existe limite de 100 no catálogo: ciclos seguintes continuam dos itens pendentes, inclusive após reinício. Quando não há pendências, aguarda o próximo delta diário. Fichas são reconsultadas no máximo a cada 7 dias, ou quando o índice indica alteração. IDs sem acesso têm intervalo de 7 dias entre tentativas.
- API token exclusivamente no header privado `api-token`; content token não é necessário para especificações. As chamadas de fichas são sequenciais. HTTP 429/5xx e token inválido interrompem o lote e aguardam 15 minutos. Nenhum fallback pago ou upgrade. Contador persistente impede novas consultas após 900 mil tentativas locais/mês, antes do limite de uso excessivo informado pelo fornecedor. Não representa a medição global de outras aplicações da conta.
- O botão manual força a consulta do delta e processa mais um lote. Não é necessário mantê-lo pressionando. `npm run hardware:sync` executa um ciclo usando a mesma fila.
- Servidor desligado não sincroniza. Não foi contratado agendador nem feito deploy. Futuro host deverá manter o processo e disco persistentes e servir os feeds atualizados; publicação estática remota isolada não recebe alterações do disco local.

## Dados públicos e desempenho

`src/data/hardware.json` mantém apenas a amostra para HTML inicial e os registros editoriais. `.editorial-admin/hardware-inventory.json` guarda o inventário leve de todos os produtos; cada ficha completa fica em seu próprio arquivo estático. O servidor não carrega todas as especificações do catálogo em memória a cada lote. Importados antigos também passam ao fluxo automático. Fichas do provedor usam `publication: provider`, revisão/revisor nulos e Open Content License, sem inventar aceite humano. Validação estrutural, categoria, conta de demonstração e proteção de credenciais continuam automáticas.

A sincronização grava manifestos leves `public/data/hardware/{phone,cpu,ram}.json` e copia atomicamente para `out/data/hardware`. Cada ficha tem JSON separado com URL imutável por hash; manifesto é publicado por último. O navegador atualiza a lista a cada minuto e baixa apenas as fichas selecionadas, em paralelo. Busca limita opções visíveis a 300 e preserva modelos selecionados. HTML inicial contém amostra de até seis fichas automáticas por categoria para não embutir todo o catálogo. Os feeds gerados são ignorados pelo Git.

Persistência usa lock global, arquivos imutáveis por ficha, inventário atômico e checkpoints a cada dez etapas; a migração preserva o catálogo anterior em `.editorial-admin/hardware-before-automatic.json`. Não produz backup completo ilimitado a cada ficha. Cache, tentativas, uso e progresso ficam privados. Uma ficha recusada não apaga a anterior nem inventa dados.

Fonte **Specs Icecat**, licença, data e ressalva de dados fornecidos como estão aparecem no comparador. Não enviar conteúdo do Icecat a Gemini ou outros modelos generativos. Dados de testes permanecem isolados. A API de especificações não fornece automaticamente preços de varejo nem benchmarks equivalentes: custo-benefício quantitativo depende desses dados reais; não há nota fabricada por GHz, mAh ou MP.

## Referências oficiais

- [Automação: índice inicial completo e deltas](https://iceclog.com/manual-how-to-import-product-content-into-your-webshop-via-icecat/)
- [Manual de Product JSON](https://iceclog.com/manual-for-icecat-json-product-requests/)
- [Open Content License](https://iceclog.com/open-content-license/)
- [Fair Use Policy](https://iceclog.com/open-icecat-fair-use-policy/)

## Primeira carga real verificada

Índice completo oficial carregado: 98.987 referências (29.514 celulares, 14.402 processadores, 55.071 módulos RAM). O primeiro lote terminou com 94 fichas disponíveis (46 celulares, 10 processadores e 38 RAM), sem aprovação humana; 23 consultas daquele lote foram recusadas/indisponíveis. Referências de índice não equivalem a fichas liberadas para a conta: a carga confirma acesso pela API individualmente. A alimentação prossegue em segundo plano.

## Fotos e categorias móveis — 23/10/2026

O comparador em `/celulares/comparar/` reúne exclusivamente celulares e tablets, com filtro Celulares e tablets / Somente celulares / Somente tablets. A categoria vem da taxonomia e da resposta oficial, nunca de palavras no título: 119 Mobile Phones, 1893 Smartphones, 897 Tablets. IDs e nomes incompatíveis, capas, acessórios, notebooks, CPU e RAM não entram no grupo móvel. `deviceType` distingue phone/tablet sem quebrar IDs e links antigos; registros legados do grupo phone continuam como celulares. Novos índices identificam o subtipo e alternam as filas de celular/tablet/CPU/RAM.

A consulta móvel usa `content=generalinfo,featuregroups,image,gallery`. O servidor baixa somente a foto principal em resolução até 500 pixels (ou a versão pequena), exclui BrandLogo, imagens privadas e taxonomias exclusivas. Aceita somente HTTPS em hosts oficiais, sem redirecionamento, até 3 MB e formatos JPEG/PNG/WebP com conferência de assinatura. Fotos são servidas localmente por hash em `public/images/hardware` e `out/images/hardware`; URLs assinadas não entram em JSON, HTML ou navegador. Imagem ausente ou falha de download não bloqueia a ficha. A interface mostra Foto não disponível e trata erro de carregamento.

`ICECAT_CONTENT_TOKEN` é opcional, privado e enviado apenas como header ao Product JSON. Não foi necessário pedir outro token: as primeiras dez fotos reais foram baixadas com a configuração gratuita existente. Tokens API/conteúdo são removidos do ambiente do build público; o importador recusa eco de qualquer um deles em campos de dados. CPU/RAM continuam consultando somente especificações. `syncVersion: 2` faz as fichas móveis antigas receberem fotos progressivamente; o índice completo é recarregado uma vez para ampliar a cobertura a celulares simples e tablets. Não há aprovação manual adicional.

[Manual oficial de imagens, galeria e autenticação](https://iceclog.com/manual-for-icecat-json-product-requests/).

## Seleção visual, pesquisa e links de lojas — 23/10/2026

O seletor agora é um combobox com miniaturas locais de 38×48 px, nome comercial e código do fabricante. Oferece busca dentro da lista, teclado (setas/Enter/Escape/Tab), rótulos ARIA, duplicatas desativadas e todos os resultados acessíveis pela rolagem da lista, sem corte por quantidade. A pesquisa pode ser refinada para encontrar qualquer modelo carregado. Resumos dos feeds incluem a foto; não é necessário baixar todas as fichas para mostrar miniaturas. Metadados anteriores são enriquecidos uma vez pela sincronização.

A busca normaliza acentos, caixa, pontuação e espaços; combina termos em qualquer ordem, reconhece S25/S 25/S-25 e prioriza o nome comercial. Exemplos cobertos: Samsung S25, S25 Samsung, S25 Ultra 256GB e S25+. Normalização não junta uma palavra inteira como Ultra ao número de capacidade. Não transforma referências ainda não importadas em fichas disponíveis. No diagnóstico local, quatro variantes S25 já publicadas estavam disponíveis; a lista completa do índice tinha mais referências em processamento.

No comparador de celulares/tablets foram retirados preço, moeda, custos extras e conclusão de custo-benefício. Ferramentas CPU/RAM preservam seu cálculo anterior. A seleção e a tabela usam nomes e códigos menores; fontes/limitações estão em detalhes expansíveis. A tabela principal prioriza campos úteis organizados por assunto, conforme atualização abaixo.

### Preparação de importação por link

No painel, Produtos e comparadores > Importar celular ou tablet por link de afiliado. O proprietário informou que ainda não tem links, mas quer Amazon Brasil e Mercado Livre. Implementados adaptadores desativados por padrão: Amazon Creators API OAuth/GetItems e Mercado Livre GET /items/{id} ou /products/{id}. Reconhecem ASIN/MLB; links curtos são expandidos no servidor por HEAD, no máximo cinco redirects, apenas HTTPS e hosts das mesmas lojas, sem scraping de páginas.

Identificação usa GTIN/EAN/UPC ou marca+código de fabricante, não correspondência aproximada pelo título. Anúncio com várias variantes ou sem identificador inequívoco recebe erro explícito. A referência exata segue pela fila Icecat já existente, sem aprovação adicional. O link é vinculado ao ID retornado somente após importação bem-sucedida. Href original preservado, armazenado privadamente e em manifesto público; somente links reais cadastrados aparecem com identificação de afiliado e rel=sponsored. Não é criado link, conta, comissão, preço ou programa fictício. Monetização geral anterior continua desativada.

Configuração privada: RETAILER_IMPORT_ENABLED=true, AMAZON_CREATOR_CLIENT_ID, AMAZON_CREATOR_CLIENT_SECRET, AMAZON_PARTNER_TAG e/ou MERCADOLIVRE_ACCESS_TOKEN. A configuração real permanece desativada, sem credenciais de lojas; botões de importação indisponíveis com status visível. Não enviar segredos por chat. Para Amazon é necessária elegibilidade e acesso à Creators API; configurar uma conta no portal não concede essa autorização. Tokens e segredos são excluídos do build público. Validação realizada com respostas sintéticas isoladas; importação real de lojas depende das contas futuras.

Referências: [Amazon Creators API/GetItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl), [ItemInfo/identificadores](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/resources/item-info), [Mercado Livre itens e buscas](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas).


## Especificações principais e idioma — 23/10/2026

A tabela de comparação deixa de listar indiscriminadamente todas as features Icecat. `src/domain/hardware/highlights.ts` define campos principais por categoria: bateria/carregamento, câmeras (resolução, lentes, abertura, zoom óptico, estabilização e vídeo), tela, processamento, memória/armazenamento, conectividade, sistema e dimensões/proteção. CPU/RAM usam os campos pertinentes, como socket/TDP/cache ou velocidade/latência/ECC/tensão. Excluídos da tabela dados de embalagem, logística, códigos internos e detalhes não selecionados. Não há corte por produto nem por marca; continua possível selecionar todos os modelos carregados.

Correspondências explícitas por rótulo/aliases de origem, com unidades preservadas, alinham campos equivalentes de modelos diferentes mesmo quando possuem IDs distintos. Se um modelo não informa um campo presente no outro, a célula indica Não confirmado. Não cria especificações, converte unidades silenciosamente ou conclui desempenho por GHz, MP ou mAh. O filtro de diferenças preserva desconhecidos e diferenças de unidade. Grupos sem nenhum campo disponível são omitidos. Dados completos e fontes permanecem nos arquivos originais e nas fichas expansíveis.

Comparador com seletor Português/English/Español. Prioridade: `?lang=pt|en|es`, preferência manual `silfontech-language` (com leitura da chave anterior `portal-language`) já usada pelo portal, idioma da rota quando aplicável, idiomas suportados do navegador; fallback português. Escolha fica salva no dispositivo e o link compartilhado preserva o idioma. Rótulos principais, grupos, controles e mensagens traduzidos; datas/números usam locale correspondente. Valores simples conhecidos (Sim/Não, tipo de conjunto de câmeras, bateria) têm dicionário. Nomes comerciais e descrições técnicas livres do fabricante permanecem no original quando não houver tradução definida; não há tradução por IA nem novas consultas/custos de API. O restante da página e fichas integrais não são apresentados como traduções editoriais revisadas.


## Vitrine e ranking de celulares — 23/10/2026

Vitrine real fornecida pelo proprietário: https://www.mercadolivre.com.br/social/dossantossilveirajoovitor, registrada em `src/data/affiliate-storefront.json`. A seção de fichas técnicas foi retirada do final de `/celulares/comparar/`, substituída por Mais vendidos, acesso à vitrine e cartões de celulares com links cadastrados. Cartões podem ser adicionados à comparação; duplicatas e limite de três respeitados. O seletor identifica links de afiliado e oferece filtro quando existem links cadastrados. Tablets continuam no comparador, mas ficam fora dos cartões/ranking de celulares.

O link /social é uma vitrine pública; não é um token nem uma referência de produto para importar. Consulta web e navegador retornaram HTTP 403. Configuração real continua sem MERCADOLIVRE_ACCESS_TOKEN, RETAILER_IMPORT_ENABLED desativado e zero links individuais cadastrados. Portanto não foi possível importar o conteúdo dessa vitrine nem confirmar seus mais vendidos. O botão abre o endereço real; estado vazio informa a ausência de ranking. Não há produtos fictícios nem inferência de afiliado a partir do slug social. Para preencher a seleção é necessário obter os links individuais dos produtos da vitrine, ou uma fonte autorizada que os entregue; um token de catálogo sozinho não concede leitura documentada da vitrine social.

Integração preparada no servidor: consulta autenticada à categoria MLB1055 com validação do nome Celulares/Smartphones, seguida de `/highlights/MLB/category/MLB1055`. Aceita apenas BEST_SELLER/CATEGORY com ID correto, posição 1–20, IDs/tipos ITEM ou PRODUCT; USER_PRODUCT sem correspondência verificável é ignorado. Ranking de vendas da categoria Mercado Livre não representa vendas pessoais do afiliado. Somente correspondência exata de ID e tipo com link individual cadastrado recebe posição. Os demais cartões aparecem separados, sem selo de mais vendido. Links curtos sem identificação explícita no href não recebem posição por aproximação; importação por link existente continua expandindo esses links para identificar o aparelho.

Atualização automática diária pelo scheduler enquanto o painel está ligado; falhas recuam 15 minutos. Botão já existente Atualizar catálogo agora também força atualização do ranking após o job. Dados expiram para apresentação após 48 horas. Credenciais somente no servidor, HTTPS/hosts fixos, sem redirects, timeouts e resposta limitada a 1 MB. Publicação atômica em public/out, estado privado; não leva token/resposta de erro ao browser. Nenhuma nova conta, scraping ou faturamento habilitado. Ranking real segue pendente de autorização oficial e links reais.

Referência oficial: [Mais vendidos / recurso highlights](https://developers.mercadolivre.com.br/pt_br/mais-vendidos-no-mercado-livre).
