# Prompt — Validação, lançamento e evolução do negócio

Copie o bloco abaixo para o agente de implementação com o pacote disponível no repositório. Este prompt não pressupõe acesso à conversa original.

```text
Você é o responsável por implementar uma etapa do Portal Tech, portal brasileiro de suporte e decisões de compra, de João. A stack é React + TypeScript, com Next.js e exportação estática; visual claro com azul conforme docs/design-system.md, editorial, acessível e confiável. O projeto deve começar sem serviços pagos. Afiliados são a primeira hipótese de monetização e AdSense é opcional posterior, sem promessa de receita.

Execute a etapa 10-validacao-lancamento-roadmap: Validação, lançamento e evolução do negócio.

Leituras obrigatórias: AGENTS.md e planos/00-diretrizes-gerais.md, planos/01-arquitetura-e-dados.md e planos/10-validacao-lancamento-roadmap.md. Leia também os contratos dos módulos consumidos por esta etapa. Se os arquivos não estiverem disponíveis, procure no repositório; não substitua requisitos ausentes por suposições. Inspecione o estado atual, dependências e docs/progresso.md antes de alterar arquivos. Preserve trabalho existente e siga as regras de AGENTS.md aplicáveis.

Tarefa específica:
Execute 10A para o núcleo, ou 10B para ferramentas explicitamente indicadas. Faça revisão do export de produção, segurança básica, conteúdo, mobile e acessibilidade, execute testes e prepare preview local e instruções de deploy/rollback. Corrija falhas do escopo. Não publique, contrate ou envie dados a terceiros. Classifique pendências externas e não declare publicável se ainda houver bloqueadores.

Procedimento obrigatório:
1. Identifique pré-requisitos e o menor conjunto coerente de alterações. Se dependência técnica estiver ausente, implemente somente o suporte mínimo documentado, sem executar módulos inteiros. Pendências de conteúdo não autorizam dados inventados.
2. Consulte documentação oficial atual quando precisar de APIs ou configuração dependente da versão. Registre decisões técnicas e instale apenas dependências necessárias, com lockfile.
3. Implemente funcionalidade real com estados de vazio, erro e sucesso pertinentes. Dados de demonstração vão exclusivamente para fixtures/previews e nunca para produção. Conteúdo não revisado fica draft; botões sem ação não podem parecer prontos.
4. Aplique os contratos, privacidade, confiança editorial, responsividade, contraste e teclado descritos nos planos. Textos em pt-BR, datas e moeda formatadas corretamente. Não exponha segredo no cliente.
5. Execute os critérios de aceite e testes significativos desta etapa, além de build/typecheck/lint quando houver código. Revise visualmente páginas alteradas se houver navegador; informe a limitação se não houver. Não declare teste não executado.
6. Atualize docs/progresso.md com escopo, arquivos, checks executados, resultados, pendências e próximo passo. Registre bloqueadores humanos/externos em docs/pendencias-editoriais.md. Não marque conclusão editorial só porque o código compila.
7. Entregue resultado implementado, não apenas sugestões. Encerre com resumo do comportamento, comandos de validação efetivamente executados, limitações e próximo prompt aplicável.

Restrições: não executar outras etapas por iniciativa própria; não comprar domínio, ativar cobrança, publicar em produção, enviar mensagens ou cadastrar contas externas. Não implementar scraping de lojas, preços fictícios, avaliações falsas, compatibilidade presumida ou coleta de dados de clientes. Realize alterações locais reversíveis autorizadas sem pedir confirmação para escolhas rotineiras. Não use subagentes sem autorização específica.
```
