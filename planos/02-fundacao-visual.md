# 02 — Fundação visual e experiência pública

## Resultado e dependências
Depende de 00 e 01. Entregar navegação, identidade visual, biblioteca mínima e páginas institucionais honestas. Não construir ferramentas falsas para preencher a home.

## Fluxos e telas
Home com busca por dúvida, trilhas de suporte e guias recentes; seções futuras ocultas por feature flag. Cabeçalho desktop e menu móvel; rodapé editorial; listagem genérica com filtros acessíveis e página de detalhe base. Estados: nenhum conteúdo publicado, busca sem resultado, rota 404 e falha recuperável em componente cliente. Institucionais: Sobre, Contato (sem formulário que finge enviar), Metodologia, Afiliados/publicidade, Privacidade e Termos. Dados pessoais ou canais não fornecidos ficam pendentes em desenvolvimento e bloqueiam lançamento das páginas que dependem deles.

## Componentes e comportamento
Button, TextLink, Input, Select, Checkbox, Badge, Alert, Disclosure, Breadcrumbs, Card editorial, ProductSummary e AdSlot inativo. Usar controles nativos primeiro; dialog apenas onde necessário com gestão de foco. Cards têm uma ação principal; sem links aninhados. Busca com label e submit, sem exigir que usuário descubra ícone. Em artigos, sumário de âncoras e link para topo sem cobrir texto. Banner editorial curto para avisos, sem modal ao abrir o site.

## Layout detalhado
Home até 1280 px, abertura em duas colunas no desktop e uma no celular; foco em utilidade, sem imagem de banco genérica de programador. Artigo central legível, sumário lateral apenas em telas largas. Cards horizontais quando ajudam a ler títulos, evitando aparência de vitrine infinita. Área de ferramentas com descrições reais e estado disponível. Tokens definidos em 00 aplicados a todos os componentes. Usar ícone vetorial simples próprio e favicon provisório substituível, sem copiar marca.

## Aceite
Menu abre/fecha por teclado; Escape e retorno de foco; nenhum controle só por hover; links externos identificáveis. Layout sem overflow global a 320 px. Contraste e foco validados em todos os estados, incluindo disabled. Home comunica o propósito em um parágrafo. Nenhum depoimento, estatística ou selo fictício. Revisar visualmente desktop e celular e registrar evidências ou limitações se navegador não estiver disponível.

## Fora do escopo
Seletor manual ou automático de temas, login, painel de usuário, redes sociais internas, anúncios ativos, animação 3D e checkout.
