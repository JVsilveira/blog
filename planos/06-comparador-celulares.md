# 06 — Comparador de celulares orientado ao uso

## Resultado e dependências
Depende de 04. Comparar dois ou três modelos/variantes de catálogo pequeno e verificado. Não confundir o mesmo nome comercial com versões de memória, região e conectividade diferentes.

## Fluxos e layout
/celulares lista modelos com busca/filtros básicos; /celulares/[slug] apresenta ficha e limites; /celulares/comparar?modelos=id1,id2 aceita até 3 IDs validados. Em celular, primeiro mostrar resumo das diferenças e seleção de dois aparelhos, depois tabela em área rolável; leitura não depende de três colunas microscópicas. Ação “Mostrar só diferenças” preserva linhas desconhecidas relevantes. Remover modelo, trocar variante, limpar e compartilhar sem cadastro.

## Dados
PhoneVariant: id, productId, manufacturerModelCode, region, ramGB, storageGB, chipset, screen{technology,sizeInches,resolution,refreshHz}, dimensions, weightG, batteryMah, chargingW, chargerIncluded, cameras com campos separados por lente e OIS, connectivity{nfc,esim,networkBands}, ipRating, operatingSystemAtLaunch, updatePolicy{sourceId,announcedYears,securityEndDate,verifiedAt}, sourceIds por campo e verifiedAt. Ausência é null, não “não possui”. Autonomia, foto e desempenho exigem ensaio comparável e fonte; capacidade de bateria e megapixels não substituem qualidade real.

## Comparação e recomendação
Comparador inicial factual, sem nota geral automática. Destacar diferença mensurável com rótulo descritivo: mais leve, maior armazenamento; não concluir “melhor câmera” por megapixels. Para usos como jogos, fotografia e longevidade, recomendações editoriais com evidência e ressalvas. Se futuramente existir score, documentar fórmula, pesos, faltantes e sensibilidade; não implementar score arbitrário agora.

## Conteúdo inicial
Selecionar 6–10 variantes apenas depois de verificar fontes oficiais. Permitir começar com menos. Fixtures para interface são sintéticas e não publicáveis; nomes reais não recebem números inventados. Resumo editorial explica quem deve escolher cada alternativa. Comparações editoriais selecionadas podem ter rotas próprias estáticas e texto original; combinações arbitrárias não geram páginas indexáveis em massa.

## Aceite e testes
Mesma unidade e formatação; null → “Não confirmado”; variantes no título; máximo 3; IDs duplicados removidos com feedback; ID inexistente não derruba página; sem oferta mostra CTA indisponível; alterar ordem mantém identidade dos dados. Testar diferença entre NFC ausente e desconhecido, política de updates vencida e variantes com mesmo nome. Fontes e datas acessíveis por campo/seção. Nenhum selo de vencedor sem justificativa editorial real.

## Métricas
Seleção de comparação, conclusão e saída para oferta com IDs públicos; não registrar texto livre de busca. Aumentar catálogo conforme comparações realmente procuradas.

## Evolução autorizada em 23/10/2026

Proprietário solicitou comparadores de CPU e RAM além de celulares, pesquisa de APIs e análise por desempenho/preço. Implementação comum em src/domain/hardware e src/features/hardware, com importação Open Icecat desativada até conta gratuita (resposta explícita do proprietário). Custo-benefício condicionado a benchmark equivalente e preço informado, sem nota agregada arbitrária; campos não confirmados não determinam vencedor. Guia operacional em docs/comparadores-e-fontes.md. Catálogo técnico anterior de celulares e suas rotas individuais preservados.
