# Cadastro e revisão de PCs — 5A

Não há configuração ou componente real aprovado. Alvos editoriais: estudo/home office, desenvolvimento e jogos. Não preencher com modelos plausíveis ou benchmarks não fornecidos.

## Contratos e cadastro

Peças usam `src/domain/schemas.ts` e o catálogo compartilhado `src/data/catalog.json`. `src/data/pc-configurations.json` começa vazio. Contrato exato: `src/domain/pc/contracts.ts`. Criar registros com status draft, aprovação null e datas reais; preencher identidade, fontes com escopo por campo, limitações e motivos por ID. Publicação exige aprovação humana da configuração e de cada peça, fontes publicadas e referências válidas. Fixtures em tests/fixtures/pcs.ts servem apenas ao teste/preview, nunca como cadastro real.

Cada seleção tem um ID por slot (CPU, placa-mãe, um kit de RAM, GPU opcional, uma unidade de armazenamento, fonte, gabinete, cooler opcional). Não suporta múltiplas GPUs, múltiplos kits, várias unidades, watercooler personalizado ou cálculo de adaptadores. Alternativas são limitadas a oito, por slot; a troca reavalia o conjunto. Não assumir que uma alternativa mantém compatibilidade.

BIOS: cadastrar matriz `cpuSupport` com CPU, versão mínima e fontes. `installedBios` registra a versão efetivamente conferida; `biosVerifiedCpuIds` lista suporte documental confirmado para essa versão. Não comparar versões lexicograficamente nem presumir que número maior implica suporte. Sem evidência, usar null. Fontes sustentam a afirmação, não são aprovação automática.

Armazenamento: `storageSlots` registra slots físicos, interface, formatos e disponibilidade na configuração; `slotRequirements` lista IDs de slots admissíveis para a unidade. `lanesVerified` só true após conferir compartilhamentos para a seleção. Reavaliar ao mudar peças. Geometria útil com radiador/cabos exige `geometryVerified`; dimensões nominais isoladas não bastam.

Fonte: contar conectores nativos da placa e GPU por nomes canônicos iguais (ex.: EPS, ATX, PCIE8) e quantidades; adaptadores não são aceitos implicitamente. `specificationSourceIds` sustenta potência contínua/conectores, sem inferir qualidade elétrica por watts ou certificação. Cooler separado exige soquete, altura e kit conferido; cooler incluído permanece unknown enquanto seu envelope físico/térmico não tiver contrato próprio.

## Energia, escopo e manutenção

Estimativa conservadora: estimativas documentadas de CPU + GPU + cooler, mais reserva fixa de 100 W para placa, kit RAM, uma unidade e ventoinhas; multiplicar por 1,30 (margem configurável de 20% a 100%). Arredondar para cima. É orçamento de potência, não medição, recomendação de fonte ou conversão de TDP em consumo. Sem estimativa de qualquer peça relevante, omitir número. Cenários fora desse envelope não são suportados.

`evaluateBuild` devolve findings e estado geral. Fail vence; qualquer unknown impede aprovação; not-applicable só elimina regra opcional. Fonte ausente ou peça não verificada impede pass. O texto aprovado é “Compatível nos critérios verificados”, nunca garantia absoluta. Fonte/cabo/monitor, desempenho, ruído, qualidade elétrica e montagem real não são certificados pelo motor. João deve revisar manualmente os conjuntos reais antes de publicar.

Rodar `npm run validate:content`, testes e build após cadastro. Erro interrompe build, sem fallback inventado. Atualização é por rebuild; preços ao vivo, scraping e total de cotação não existem. Ofertas usam o contrato compartilhado e consulta por peça, sem tracking inventado.

## Próxima subetapa

5B não executada: sem montador livre, salvamento local, compartilhamento por URL ou eventos de início/conclusão. Há apenas contrato serializável v1 e resolução recuperável de IDs removidos. Antes de 5B, validar conclusão técnica de 5A e disponibilidade/revisão do catálogo real.

Prompt: “Execute somente a subetapa 5B de planos/05-pcs-configuracoes-e-montador.md. Verifique primeiro a conclusão de 5A e suas pendências em docs/progresso.md e docs/pendencias-editoriais.md. Reutilize os contratos e evaluateBuild; não presuma compatibilidade nem invente catálogo.”
