# 00 — Diretrizes gerais do produto e regras para IA

## Objetivo e público
Construir uma autoridade editorial independente em português do Brasil para pessoas que precisam resolver problemas de tecnologia e comprar melhor. Público principal: consumidores, estudantes e pessoas em home office. Público secundário: técnicos e prestadores de TI, atendidos em seção própria. O proprietário é João; informações profissionais específicas, foto e contato só entram se fornecidos ou confirmados. A arquitetura deve permitir substituir a marca provisória em um arquivo.

Proposta: “Entenda o problema, compare suas opções e escolha com segurança”. Impressão desejada: publicação especializada com ferramentas úteis, visual marcante e confortável. Não um agregador automático de notícias, marketplace próprio ou loja que recebe pagamentos.

## Escopo em ordem de valor
1. Fundação visual e técnica.
2. Blog de suporte e guias de compra.
3. Recomendações pessoais e catálogo pequeno.
4. Monetização e medição configuráveis, sem anúncios reais inicialmente.
5. Lançamento público do núcleo após revisão editorial.
6. Configurações de PCs selecionadas e depois montador livre.
7. Comparador de celulares com poucos modelos verificados.
8. Orçamentos para profissionais de TI, local e privado.
9. Operação editorial e evolução guiada por métricas.
Não esperar a conclusão das ferramentas para divulgar o blog. O roadmap não é uma promessa de cronograma nem de ganhos.

## Direção visual vinculante
- Tema claro padrão com azul, autorizado pelo proprietário em 22/10/2026; usar fundo branco, superfícies azuladas discretas, divisórias sutis e áreas de respiro. A direção anterior escura foi substituída; referência vigente em docs/design-system.md.
- Tokens: background #FFFFFF; surface #F3F6FB; elevated #E8EFF8; text #182335; muted #526176; border #DBE3ED; primary #1757B8; primary-solid #1D4ED8 com texto branco; success #166534; warning #854D0E; danger #B42318; control-border #5E6D82; focus #1D4ED8. Validar contraste de cada combinação real, especialmente botões e texto secundário.
- Links textuais azuis sublinhados em conteúdo; foco com outline de 2–3 px visível e offset. Não usar cor sozinha para expressar estado.
- Tipografia: fonte de sistema como padrão; opcional fonte open source hospedada localmente após checar licença. Texto de artigo 17–19 px, entrelinha 1,65–1,8 e largura de 65–75 caracteres. Nunca cinza de baixo contraste para texto essencial.
- H1 fluido entre 32 e 56 px conforme viewport; títulos informativos e curtos. Não usar blocos inteiros em caixa alta.
- Escala de espaço 4/8/12/16/24/32/48/64 px. Conteúdo geral até 1200–1280 px; bordas arredondadas 12–16 px; sombras discretas.
- Azul é destaque, não iluminação permanente: sem neon excessivo, efeitos de vidro dominantes, partículas, vídeo de fundo, carrossel automático ou animações de entrada em todo elemento.
- Motion 120–200 ms para feedback; respeitar prefers-reduced-motion. Não animar conteúdo essencial de forma que fique invisível antes do JS.
- Ícones consistentes, acompanhados de texto quando a ação não for óbvia. Imagens reais/autorizadas, sem fotos de produtos inventadas.

## Páginas e navegação
Cabeçalho com marca, Ajuda, Recomendações, PCs, Celulares e Para técnicos; módulos futuros não aparecem como funcionalidades prontas. No celular: menu acionável com foco contido, Escape fecha e foco retorna ao botão. Busca acessível. Rodapé com Sobre, Contato, Política editorial, Afiliados e publicidade, Privacidade e Termos. Não preencher políticas com afirmações sobre sistemas inexistentes.

Home editorial: abertura curta com proposta e busca; caminhos “Resolver um problema” e “Escolher uma compra”; guias úteis; recomendações contextualizadas; ferramentas disponíveis; autoria e metodologia. Evitar grade repetitiva de dezenas de cards, números de usuários falsos, selos decorativos de confiança e avaliações sem origem.

## Responsividade e acessibilidade
Projetar mobile-first e validar 360, 390, 768, 1024 e 1440 px. Sem rolagem horizontal global em 320 px. Tabelas podem ter área de rolagem própria com aviso e cabeçalhos persistentes quando útil. Alvos interativos preferencialmente 44×44 px, rótulos explícitos, estados de erro associados ao campo, skip link, landmarks, ordem de títulos e foco previsível. Meta WCAG 2.2 AA; auditar contraste e teclado, além de ferramentas automáticas. Ferramentas precisam funcionar sem depender de hover.

## Autoridade e regras editoriais
Toda recomendação declara método: testado pessoalmente, análise documental ou configuração editorial. Só o proprietário confirma experiência pessoal. Artigos têm autor, publicadoEm, revisadoEm, fontes e limitações. Correções relevantes deixam registro. Não fabricar notas, benchmarks, preços, citações ou número de clientes. IA pode organizar rascunhos; publicação demanda revisão humana. Informação incompleta deve ser marcada, nunca preenchida por plausibilidade.

## Monetização confortável
Afiliados com contexto e aviso visível próximo às recomendações. Sem popunders, cliques induzidos, contagem regressiva falsa ou links camuflados. Ads só após configuração e aprovação: nunca interceptar ferramentas, cobrir conteúdo ou deslocar botões. Prioridade de leitura e de confiança acima da quantidade de anúncios.

## Qualidade e limites da IA
Antes de codificar, inspecionar repositório e versão instalada. Não reescrever projeto existente por conveniência. Usar documentação oficial atual para APIs e dependências. Fixar lockfile e compatibilidade da versão Node, sem dependências desnecessárias. Regras de domínio ficam em funções puras, fora de componentes.

Para cada etapa: registrar escopo, implementar estados vazio/erro/carregamento/sucesso pertinentes, validar os critérios, executar checks proporcionais e atualizar progresso. Não aceitar sucesso silencioso, dados fictícios em produção, testes que apenas repetem constantes ou mudanças fora do escopo. Não adicionar login aos leitores, serviços de IA pagos ou scraping ao MVP. Área editorial remota com Google OAuth autorizada em 22/10/2026, conforme ADR do plano 01.

## Definição geral de pronto
Funcionalidade acessível por URL direta, móvel e teclado; dados com origem; demonstrações isoladas; build e typecheck aprovados; testes críticos executados; conteúdo público presente no HTML inicial; ausência de segredos e PII em eventos; documentação de execução e limitações. Publicação é etapa própria, não consequência automática de terminar código.

## Evolução autorizada — portal editorial internacional (22/10/2026)

O proprietário ampliou o escopo para notícias, opinião e blog sobre política, esporte, economia e outros temas. Edições português, inglês e espanhol, preferência do navegador e seletor manual, conteúdo traduzido com revisão própria. Route groups permitem layouts raiz por idioma preservando URLs anteriores e export estático; global-not-found cobre 404 entre layouts. API/Gemini continua privada apenas no painel, sem tradução por request de leitor nem custo adicional de geolocalização. Detalhes e limites em [Portal editorial internacional](../docs/portal-editorial-internacional.md). Esta autorização substitui o escopo exclusivamente tecnológico, preservando regras de fontes, revisão e não inventar conteúdo.

## Evolução autorizada — catálogo automático Icecat (23/10/2026)

O proprietário dispensou explicitamente aprovação manual das fichas dos comparadores e pediu toda a cobertura gratuita nas categorias celular, CPU e RAM. Este recorte substitui a exigência anterior de revisão humana para fichas do Icecat: `publication: provider`, status publicado, revisão e revisor nulos, origem/licença preservadas. Índice Open completo inicial, deltas diários, importação progressiva contínua e atualização pública de feeds estáticos sem build por ficha. Conteúdo editorial, notícias e recomendações humanas permanecem sujeitos às regras anteriores. Não contratar serviços nem ativar upgrade; limitar chamadas antes do patamar de uso excessivo do provedor.
