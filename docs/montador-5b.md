# Montador livre 5B — ativação editorial

Código disponível em `/pcs/montar/`, sempre noindex. `src/config/site.ts`: `pcBuilder: false` permanece. Com flag desligada o HTML só apresenta indisponibilidade; não envia catálogo nem controles do montador. Catálogo público atual: zero produtos. Não houve publicação. Configurações editoriais, seus motivos e alternativas permanecem intactos.

## Dados exatos para ativação

Cadastrar em `src/data/catalog.json` componentes reais revisados, com IDs estáveis. Para todos: `id`, `schemaVersion`, `status`, `createdAt`, `updatedAt`, `slug`, `name`, `brand`, `category`, `specs.category`, `sourceIds`, `images` (pode ser vazio), `verificationStatus`, `verifiedAt`, `editorialStatus`, `ownerApprovedAt`. Publicação exige status/editorialStatus published, verificationStatus approved e revisão/aprovação documental. Fontes publicadas precisam de `id`, `schemaVersion`, `status`, `createdAt`, `updatedAt`, `url` HTTPS, `publisher`, `accessedAt`, `scope` por campo (e `note`, conforme schema). Não usar fixtures como cadastro real.

Campos tipados obrigatórios por categoria (usar `null` para desconhecidos quando o schema permitir, nunca inventar):

| Categoria | Campos em specs |
| --- | --- |
| cpu | socket, powerEstimateW, integratedGraphics, memoryTypes, coolerIncluded |
| motherboard | socket, chipset, formFactor, memoryType, memoryFormFactor, maxMemoryGB, slotsMemory, storageInterfaces, storageSlots[{id,interface,formFactors,available}], pcieSlots, powerConnectors por tipo/quantidade, videoOutputs, cpuSupport[{cpuId,minimumBios,sourceIds}], installedBios, biosVerifiedCpuIds, lanesVerified |
| ram | type, kitCount (número de módulos), moduleCapacityGB, formFactor, speedMTs, profileSupport (JEDEC/XMP/EXPO) |
| gpu | lengthMm, thicknessSlots, powerEstimateW, requiredPowerConnectors por tipo/quantidade, videoOutputs |
| storage | interface, formFactor, capacityGB, slotRequirements (IDs dos slots) |
| psu | continuousPowerW, formFactor, connectors por tipo/quantidade, specificationSourceIds |
| case | supportedBoardFormats, gpuClearanceMm, gpuClearanceSlots, coolerClearanceMm, psuFormats, radiatorRestrictions, geometryVerified |
| cooler | supportedSockets, heightMm, mountingKitRequirement, mountingKitVerified, powerEstimateW |

Mínimo editorial: opções reais para CPU, placa-mãe, RAM, armazenamento, fonte e gabinete; GPU se não houver caminho de vídeo integrado documentado; cooler separado enquanto o envelope do cooler incluído não puder ser verificado. Revisar manualmente conjuntos e alternativas, BIOS instalada/mínima, conectores nativos, ocupação M.2, lanes e geometria da combinação. Booleanos `lanesVerified` e `geometryVerified` exigem fonte e revisão para as combinações disponíveis: o modelo atual não descreve todas as dependências entre peças de um catálogo amplo. Não ativar um catálogo universal com esses indicadores genéricos. Unknown permanece pendência; não exige inventar valor para publicar uma peça, mas impede aprovar o conjunto.

Ofertas são opcionais: cadastrar conforme `offerSchema`, com destino HTTPS, fonte, revisão e `lastLinkCheck`; links comerciais seguem a política existente. Sem oferta verificada, mostrar indisponibilidade; sem cotação total. Nenhuma certificação elétrica por watts/80 PLUS ou aprovação de CPU por socket.

Após revisão humana: validar catálogo, motor e export, repetir a jornada móvel com os conjuntos reais e só então alterar `pcBuilder` para true em mudança revisável e gerar novo export. A flag não publica automaticamente. 5A e sua flag são independentes.

## Persistência, URL e recuperação

Estado em memória; salvar, carregar e apagar somente por ação explícita. Chave local `silfontech:pc:v1` (leitura compatível com `portal-tech:pc:v1`). JSON estrito `{schemaVersion:1,components:{cpu,motherboard,ram,gpu,storage,psu,case,cooler}}`, cada slot ID ou null. Limite 2.400 caracteres JSON / 7.200 codificados; `#build=` contém JSON URI-encoded (fragmento não enviado ao host). Sem nomes de clientes, preços ou metadados pessoais. Versão 1 é inicial; versões diferentes são recusadas até existir migração explícita documentada. Não há migração presumida.

Abrir link não substitui seleção automaticamente: clicar “Carregar seleção do link”. IDs ausentes, categoria errada, conteúdo corrompido, campos extras e versão futura geram mensagem recuperável, preservando seleção atual. Escolher manualmente outra peça corrige o conjunto; não há substituição silenciosa. LocalStorage bloqueado/sem espaço apresenta erro e mantém memória. Limpar seleção não apaga salvamento; apagar salvamento tem ação própria.

## Verificação local

`npm run test:pcs-export -- --preview` cria cópia temporária com fixtures sintéticas e flag habilitada apenas nessa cópia; publica artefato local em `output/pcs-preview`, nunca em `out`. Inclui CPU alternativa fora da matriz, RAM DDR4 e GPU sem dimensão para negativas. `output/playwright/pc5b-journey.js` registra o percurso Chromium. O export público mantém apenas indisponibilidade e o smoke verifica ausência de controles/fixtures.

Eventos limitados a início, conclusão com status e slot escolhido, usando adaptador existente desligado, sem IDs do conjunto ou orçamento. Não há provedor remoto. Preços, FPS, qualidade elétrica e compatibilidade absoluta não são inferidos.
