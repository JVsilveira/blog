# Área editorial com Google OAuth

## Decisão e arquitetura

Em 22/10/2026, o proprietário solicitou uma área editorial acessível pela internet e escolheu explicitamente Google OAuth. Esta decisão substitui a restrição anterior de operação somente local para o **painel editorial**, sem criar login para os leitores.

O portal público continua Next.js com export estático. A aplicação `admin/` é um serviço Next.js Node separado, com login Google no servidor, editor e acesso aos arquivos editoriais existentes. Ambos compartilham os schemas e o design system. Nenhum painel administrativo ou rascunho é exportado em `out/`.

Requisitos técnicos desta opção: servidor Node compatível com package.json, uma instância do painel, checkout de trabalho em disco **persistente**, permissões de escrita, backup privado e reverse proxy HTTPS. A origem pública e a origem editorial podem estar em domínios/subdomínios distintos. O painel não funciona em GitHub Pages nem em um diretório estático. Discos efêmeros e múltiplas réplicas não são suportados por este adaptador de arquivos; para esses hosts será necessária uma implementação de armazenamento durável apropriada antes de implantar. Nenhum serviço, domínio, cobrança ou conta foi criado.

Não há migração de banco nem custo de serviço contratado por esta entrega. Há custo operacional a avaliar com o provedor escolhido (Node, disco, TLS e backup). A arquitetura está implementada e verificável localmente; escolha do host e configuração real do OAuth continuam externas.

## Google Cloud e variáveis

1. No projeto Google Cloud do proprietário, configure a tela de consentimento/branding e um cliente OAuth do tipo **Aplicativo da Web**. Em modo de testes, autorize as contas de teste necessárias. Não precisa de permissões de Drive, Gmail ou Calendar: os escopos são apenas `openid email profile`.
2. Cadastre exatamente a URI de redirecionamento: `https://SEU-DOMINIO-EDITORIAL/auth/callback`. Em desenvolvimento, pode usar `http://localhost:4180/auth/callback`. Hostname, esquema e porta precisam corresponder a EDITORIAL_ORIGIN; não misture localhost e 127.0.0.1.
3. Copie `admin/.env.example` para `admin/.env.local` **somente na máquina/servidor**, ou configure as variáveis no gerenciador de segredos do host:
   - `EDITORIAL_ORIGIN`: origem do painel, HTTPS em acesso remoto; HTTP apenas em localhost/127.0.0.1.
   - `EDITORIAL_ROOT`: caminho absoluto do checkout persistente do SilfonTech, que contém src/data, src/content, docs/editorial e os scripts/dependências de build.
   - `EDITORIAL_ADMIN_EMAILS`: e-mails Google autorizados, separados por vírgula. Vazio bloqueia o login. Aceitar uma conta Google não concede acesso por si só.
   - `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: cliente OAuth do painel. Não usar NEXT_PUBLIC_, não enviar pelo chat, não registrar em logs e não commitar.
4. O login só é habilitado quando a configuração está completa. O projeto não fornece conta, segredo ou modo de bypass. O botão desabilitado informa configuração pendente honestamente.

```bash
npm ci
npm run admin:dev
# Painel local: http://localhost:4180

npm run admin:typecheck
npm run admin:build
npm run admin:start
```

Dev/start escutam somente 127.0.0.1:4180. Em produção, coloque o serviço atrás de um reverse proxy HTTPS que preserve Origin e encaminhe esse host. Use o gerenciador de processos do provedor para manter Node ativo. Restrinja logs de `/auth/callback` para não armazenar query de OAuth; nunca registrar tokens, cookies ou corpos dos artigos. Aplique limites de requisição/tamanho no proxy e monitore espaço em disco. Sessões, transações OAuth e backups ficam em `.editorial-admin/` com arquivos privados, fora do build público e do versionamento.

## Uso editorial

- **Postagens:** criar, procurar e editar guias/postagens. Endereço (slug) estável após a criação; editor Markdown com prévia, título, resumo, categoria, tags, autor, fontes, método e limitações. Não há dados fictícios nem aprovação automática.
- **Autoria:** cadastrar/editar o nome do autor e confirmar sua aprovação real. Um autor ainda draft impede publicação de artigo.
- **Fontes:** URL HTTPS, responsável, escopo e data da consulta efetiva. Marcar aprovação apenas depois de conferir a fonte. Fontes draft não podem sustentar artigos publicados. Observações são opcionais.
- **Rascunho:** privado para leitores. Salvar exige os campos mínimos do contrato, mas não concede aprovação editorial. O painel mantém os dois rascunhos existentes sem modificá-los.
- **Aprovado para publicação:** exige confirmação explícita a cada salvamento, autor/fontes aprovados e validação do catálogo, controle editorial, marcadores de template e links locais. O servidor registra as datas reais e o revisor autenticado; o cliente não decide e-mail, datas ou aprovação de terceiros.
- **Arquivado:** retira o registro da próxima versão pública, sem excluir os arquivos. Referências quebradas são recusadas. Não há exclusão permanente nesta versão.
- **Gerar versão do portal:** executa validação, build do site público com Webpack (também compatível com dependências em workspace/symlink) e finalização de export em `out/`. Há estado de fila/execução/sucesso/erro. Não realiza deploy, não ativa indexação, não altera consentimentos e não envia conteúdo a terceiros. Enquanto gera, a escrita editorial é bloqueada para manter uma versão consistente.
- **Sair:** revoga a sessão no servidor e apaga o cookie. Remover um e-mail da configuração também revoga sua permissão na próxima leitura de sessão.

Slugs/categorias e rótulos atuais foram preservados. Campos de recomendações relacionadas já existentes são mantidos pelo editor; gerenciamento de produtos continua no fluxo próprio. Upload de imagens não foi adicionado: imagens exigem um contrato de direitos específico antes de entrar em Markdown. A prévia não executa HTML.

## Salvamento, recuperação e operação

Os arquivos de cada artigo permanecem em `src/content/articles/<slug>/{article.json,body.md}`; fontes e autores em src/data/catalog.json; controle em docs/editorial/controle.json. O painel reutiliza os schemas do portal e valida o estado candidato antes de escrever. Revisão global por hash impede sobrescrita por outra aba; conflito exige recarregar, preservando o texto na tela para cópia manual.

Cada operação usa um lock em `.editorial-admin/lock`, backups privados e diário de transação. Escritas individuais usam arquivo temporário e rename; se houver erro, o estado anterior é restaurado. Em caso de queda no meio da escrita, o diário é restaurado antes da próxima leitura após liberar o lock de processo interrompido. Isso protege erros de processo; não substitui filesystem durável ou backup externo testado.

Se o serviço cair durante gravação/build, pare o painel, confirme que o processo identificado em `.editorial-admin/lock/pid` e seus subprocessos já terminaram e só então remova o lock abandonado. Preserve `transaction.json`: a próxima operação o usa para restaurar o estado anterior. Logs privados da geração ficam em `.editorial-admin/build-<id>.log`; são acessíveis somente ao operador do servidor, não pela API. O painel informa em qual etapa houve falha. O processo de build não recebe GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou EDITORIAL_ADMIN_EMAILS. Se build.json ficar queued/running após a queda, preserve uma cópia para diagnóstico e remova apenas esse arquivo antes de reagendar. Não remova locks de processos ativos. Não executar dois painéis sobre o mesmo checkout. Backups históricos devem ter retenção definida pelo operador e nunca ser servidos publicamente.

Cookies são HttpOnly, SameSite=Lax e Secure sob HTTPS; sessões opacas têm validade de oito horas. Arquivos expirados devem entrar na rotina de limpeza privada do servidor. Login usa state vinculado ao navegador, PKCE S256, nonce e code de uso único. A biblioteca oficial Google verifica assinatura, audience, issuer e exp do ID token; depois o servidor verifica email_verified, nonce e allowlist exata. Tokens OAuth não são guardados na sessão. Mutações exigem sessão, Origin exata e CSRF; JSON tem limite de 512 KB. Toda leitura privada é autenticada; esconder links não é a proteção.

Após gerar out/, a implantação precisa copiar **somente o artefato público** para a hospedagem, com troca de versão e rollback. Não servir o checkout ou `.editorial-admin/`. Não apontar o host público para um out/ em reconstrução. Enquanto hospedagem/pipeline não forem definidos, o painel informa que gerar a versão não a coloca na internet. O job não oferece comando de shell, URL de webhook ou destino configurável pelo navegador.

## Fontes e limites da validação

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
- [Biblioteca oficial Google OAuth2Client](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/oauth2client).
- [Next CLI: aplicações em diretórios separados](https://nextjs.org/docs/app/api-reference/cli/next).
- [Parser CommonMark compartilhado com remark-parse](https://github.com/syntax-tree/mdast-util-from-markdown).

Sem cliente OAuth, conta autorizada e origem real, não é possível comprovar um login real no Google nem uma implantação remota. Testes automatizados usam chaves/contas/arquivos sintéticos isolados; não concedem aprovação aos artigos reais. Resultados e evidências executados estão em docs/progresso.md.

### Perfil no cabeçalho

O painel apresenta foto, nome e e-mail recebidos do ID token validado do Google. Nome e foto são opcionais e ficam apenas na sessão privada; a permissão continua vinculada ao e-mail verificado da allowlist. Fotos aceitam HTTPS em googleusercontent.com e seus subdomínios; na ausência ou falha da imagem são exibidas iniciais. Sessões anteriores continuam válidas; sair e entrar novamente solicita o escopo profile e preenche o cabeçalho com os dados disponíveis.

### Sugestão de título com Gemini do Google AI Studio

No editor, **Sugerir título com IA** preenche o campo Título usando o texto atual, inclusive alterações não salvas. É possível editar, apagar ou clicar novamente para solicitar outra alternativa. A aplicação de uma sugestão marca o rascunho como alterado e remove aprovação anterior. Salvar fica bloqueado durante geração; alterações no texto durante a chamada impedem aplicação de resposta obsoleta. Nada é salvo/publicado automaticamente.

Integração autorizada pelo proprietário em 22/10/2026 para usar sua API gratuita do Google AI Studio. Gemini substitui OpenAI; não há login ChatGPT, modelo local ou fallback para outro serviço. A aplicação usa o modelo fixo `gemini-3.5-flash-lite`, listado no nível gratuito na data da implementação, com Interactions API do Google. Não usa ferramentas, grounding, busca na web, agentes ou upload de arquivos. Não faz upgrade, vinculação de faturamento ou compra de créditos. Limites/quota retornam erro e mantêm o título, sem repetição automática.

Configuração privada em `admin/.env.local`:

```dotenv
EDITORIAL_AI_ENABLED=true
GEMINI_API_KEY=
```

Preencher a chave somente nesse arquivo, já ignorado pelo Git, e reiniciar o painel com `npm run admin:start` (ou admin:dev). Não enviar chave pelo chat, nem usar NEXT_PUBLIC_. O exemplo não contém chave real. Sem chave ou com flag diferente de true, interface e rota ficam indisponíveis antes de qualquer chamada externa. A chave é enviada em header x-goog-api-key, nunca na URL ou no HTML. Nenhuma chave do OpenAI ou outra variável serve de fallback. O Google OAuth do painel continua separado dessa credencial.

**Custo zero depende do projeto da chave continuar no nível Free, sem faturamento ativo.** Conferir o tier na página Projects/Usage do AI Studio. O código não tem acesso ao estado de faturamento e não pode certificar pela chave que o projeto está no plano gratuito; usar o mesmo modelo em projeto pago pode gerar cobrança. Não habilitar faturamento para resolver limite de cota; aguardar sua renovação. As condições e limites são definidos pelo Google e devem ser revistos quando mudar modelo/projeto. Não há promessa de disponibilidade ilimitada.

Cada clique faz uma chamada HTTPS ao endpoint fixo `https://generativelanguage.googleapis.com/v1beta/interactions`, com store:false, JSON Schema, limite de 256 tokens e thinking minimal. Entrada: título, resumo, categoria, até 1.200 caracteres de método/limitações, primeiros 12.000 caracteres do corpo e até 20 títulos anteriores. Nenhum cookie, sessão, CSRF, foto ou e-mail é enviado ao provedor. No nível gratuito, o Google informa uso do conteúdo para melhoria de seus produtos; não incluir dados pessoais/sensíveis no artigo enviado. store:false desativa armazenamento da interação para continuação; não é garantia de retenção zero pelo fornecedor.

Uma geração concorrente por instância e timeout de 30 segundos; nenhum retry automático. Validação Zod descarta resposta incompleta, recusa, JSON inválido, título repetido ou com markup/quebras de linha. Erros de chave, acesso ao modelo, quota, rede ou tempo mantêm o título. A rota POST /api/title exige sessão Google autorizada, Origin exata, CSRF e corpo limitado. A chave Gemini e eventuais credenciais de outros provedores são removidas do ambiente herdado pelo build público.

Referências oficiais consultadas em 22/10/2026: [preços e nível gratuito](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite), [faturamento](https://ai.google.dev/gemini-api/docs/billing), [Interactions](https://ai.google.dev/api/interactions-api), [saída estruturada](https://ai.google.dev/gemini-api/docs/structured-output), [chaves de API](https://ai.google.dev/gemini-api/docs/api-key).

### Notícias, opinião e traduções

Tipo de publicação, editorias gerais e versões internacionais foram adicionados em 22/10/2026. [Fluxo e revisão de traduções](../portal-editorial-internacional.md). A IA de títulos considera o tipo/editoria e não deve transformar opinião em fato; publicação e traduções seguem revisão humana.
