# 05 — PCs: configurações selecionadas e montador compatível

## Resultado e ordem interna
Depende de 04. Etapa 5A: configurações editoriais verificadas, com uso pretendido e alternativas limitadas. Etapa 5B: montador livre sobre o mesmo catálogo e motor de regras, somente após 5A validada. Não começar com banco universal ou scraping de preço. Três configurações-alvo: estudo/home office, desenvolvimento e jogos; nenhuma promessa de FPS sem benchmark verificável.

## Fluxos e telas
/pcs lista configurações por uso; /pcs/configuracoes/[slug] mostra componentes, motivo de cada escolha, compatibilidade e limitações; /pcs/montar permite escolher CPU, placa-mãe, RAM, GPU opcional, armazenamento, fonte, gabinete e cooler. Ordem guiada reduz incompatibilidades, mas usuário pode revisar qualquer slot. Exibir compatíveis, incompatíveis e não verificados com explicação; oferecer ocultar incompatíveis sem apagá-los silenciosamente da seleção atual. Resumo lateral vira painel abaixo no celular; nunca cobre controles.

## Contratos por componente
CPU: socket, powerEstimateW, integratedGraphics (boolean/null), memoryTypes suportados e coolerIncluded. Motherboard: socket, chipset, formFactor, memoryType, maxMemoryGB, slotsMemory, storageInterfaces, pcieSlots, powerConnectors, videoOutputs e referências de suporte CPU/BIOS. RAM: type, kitCount, moduleCapacityGB, formFactor, speedMTs e suporte JEDEC/XMP/EXPO identificado. GPU: lengthMm, thicknessSlots, powerEstimateW, requiredPowerConnectors. Case: supportedBoardFormats, gpuClearanceMm, coolerClearanceMm, psuFormats e restrições com radiador. Cooler: supportedSockets, heightMm, mountingKitRequirement. PSU: continuousPowerW, formFactor, connectors com quantidades e evidência de especificação; não afirmar qualidade elétrica só por watts/80 PLUS. Storage: interface, formFactor, capacityGB e slot requirements. Para todos, null significa desconhecido. CPU support matrix e limitações de compartilhamento de lanes podem ser desconhecidas e devem aparecer como pendência.

## Motor de compatibilidade
Função pura evaluateBuild retorna findings[{ruleId,status,severity,componentIds,message,sourceIds}], status geral e estimatedPowerW opcional. Estados por regra: pass/fail/unknown/not-applicable. Fail impeditivo vence; caso contrário pendência relevante produz “Precisa de verificação”; somente todos os checks relevantes conhecidos e aprovados geram “Compatível nos critérios verificados”, acompanhado de escopo. Não anunciar compatibilidade absoluta.

Regras mínimas: socket; suporte CPU na matriz da placa-mãe e BIOS mínima (socket igual não basta); RAM DDR/tipo/formato/capacidade e quantidade de slots; gabinete x placa; GPU x espaço; cooler x socket/altura; fonte x formato/conectores/capacidade; armazenamento x interfaces/slots e ocupação; necessidade de GPU dedicada quando não há vídeo integrado e caminho de saída adequado. XMP e clocks elevados são condicionais, não garantidos. Conectores e adaptadores da GPU exigem regra documentada. Sem dados de lane/BIOS/geometria necessários, retornar unknown.

Energia: estimativa conservadora com metodologia documentada, margem configurável e limites claros; TDP não é consumo total. Não recomendar fonte específica só pelo cálculo. Sem dados suficientes, não exibir número preciso. Não somar preços de fontes distintas ou desatualizadas como se fossem cotação atual. Total só para ofertas autorizadas comparáveis; caso contrário “Consulte os preços nas lojas”.

## Salvamento e compartilhamento
Build serializável por IDs e versão do schema; salvar local só por ação. Compartilhar IDs não pessoais por URL compacta com limite de tamanho, validação de entrada e migração; manter páginas de combinações fora de indexação, sem gerar milhares de URLs SEO. Link de compra por peça. Alterações no catálogo marcam componente removido, não substituem silenciosamente.

## Casos obrigatórios de teste
Socket diferente → fail; socket igual com BIOS desconhecida → unknown; DDR4 x DDR5 → fail; placa grande em gabinete menor → fail; GPU maior que espaço → fail; cooler alto → fail; conector ausente → fail; GPU sem dimensão → unknown; sem GPU e CPU sem iGPU → fail; conjunto conhecido válido → pass nos critérios cobertos; peça removida ao importar → erro recuperável. Testar troca de CPU invalidando a placa atual, RAM em kits e slot M.2 indisponível. Fixtures sintéticas rotuladas, além de validação manual dos conjuntos reais antes da publicação.

## Aceite e métricas
Compatibilidade explicável por regra e fonte, nenhum unknown verde, conclusão completa por teclado e mobile. Medir início, conclusão e clique por slot/categoria; nunca enviar build inteiro ou orçamento pessoal. Lançar 5A independentemente de 5B. Cadastro real de peças é tarefa editorial com esforço próprio.
