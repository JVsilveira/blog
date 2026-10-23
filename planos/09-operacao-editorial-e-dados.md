# 09 — Operação, dados, curadoria e manutenção

## Resultado
Operação sustentável sem backend pago nem painel remoto. Criar templates, validação e documentação para que João acrescente conteúdo sem editar componentes. Não fabricar um painel com senha no frontend; segredo no JS não autentica ninguém.

## Fluxo editorial
Backlog → pesquisa → rascunho → revisão técnica → revisão de compra/afiliados quando aplicável → publicado → revisão periódica → arquivado/corrigido. Separar aprovação editorial de testes técnicos. Cada artigo e produto tem proprietário/revisor, fontes, data e campo de próxima revisão opcional. O deploy público consome apenas aprovados; a IA pode criar rascunhos, nunca declarar aprovação humana inexistente.

## Cadastro e importação
Templates JSON/Markdown com documentação por campo. Scripts validate:content e validate:catalog verificam schema, integridade referencial, IDs, datas, enumerações, unidades, licença de ativo e campos obrigatórios por status. Falhas mostram caminho e instrução de correção, sem despejar dados de clientes. Import CSV opcional só se justificável; MVP pode usar JSON e Git. Toda importação normaliza unidades e preserva origem. Sem coletar em massa catálogo de lojas ou fabricantes sem validar acesso e direitos.

## Matriz de fonte
Preferir documentação oficial de fabricante para especificação e suporte CPU/BIOS; fontes independentes confiáveis para testes comparáveis; experiência do proprietário para uso pessoal. Se duas fontes conflitam, registrar conflito, escolher variante correta ou manter campo desconhecido. Fonte desaparecida exige revisão, não inventar substituição. Documentar quais campos demandam confirmação por variante/país.

## Manutenção prática
Semanal: revisar links das páginas que recebem visitas e erros reportados, validar build e novas recomendações. Mensal: revisar modelos mais acessados, políticas de afiliados e páginas institucionais conforme mudanças reais. Revisão por evento: firmware/BIOS, peça removida, atualização de suporte e mudança de especificação. Não afirmar “atualizado hoje” por rebuild automático.

## Conteúdo e marketing
Backlog de pelo menos 20 pautas agrupadas por problema e intenção de compra, cada uma com leitor, pergunta, fontes necessárias, possível recomendação e dificuldade de produção. Criar outlines, não textos genéricos em massa. Para cada publicado, roteiro curto demonstrativo e imagem derivada autorizada; links divulgados somente nos canais permitidos pelo programa, sem spam em comunidades. Mensagens e posts são rascunhos; nenhum envio automático.

## Aceite
Uma pessoa segue tutorial e publica um artigo draft→published sem mexer em TSX. Produto inválido e link quebrado local bloqueiam build com diagnóstico legível. Ativos têm direitos documentados. Dados de clientes nunca entram no repositório. Progresso identifica honestamente pendências de dados. Painel administrativo remoto só entra via novo plano com autenticação e orçamento.

## Evolução autorizada — painel remoto

Em 22/10/2026 o proprietário solicitou painel com Google OAuth. A operação em arquivos continua, agora também por aplicação Node autenticada separada; o ADR do plano 01 e docs/editorial/painel-google-oauth.md definem este recorte. Login simulado ou senha no frontend continuam proibidos.
