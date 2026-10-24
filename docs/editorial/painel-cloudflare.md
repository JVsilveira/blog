# Administração online SilfonTech

Painel: https://silfontech-admin.devsilveira.workers.dev/login
Site: https://silfontech.com.br/

Google OAuth aceita exclusivamente os e-mails configurados no secret EDITORIAL_ADMIN_EMAILS. No cliente OAuth do Google Cloud, cadastrar em URIs de redirecionamento autorizados:

```
https://silfontech-admin.devsilveira.workers.dev/auth/callback
```

Não cadastrar esse caminho como origem JavaScript. O login usa redirecionamento no servidor. Não há cadastro público nem senha própria. Foto/nome/e-mail vêm do perfil Google validado e ficam na sessão privada. Uma URI autorizada no Google não concede acesso a contas fora da allowlist.

## Escrever e publicar

Entrar, abrir uma postagem ou criar outra, selecionar tipo/categoria/ordem de destaque e salvar. Rascunhos ficam no D1 e não aparecem no site. A publicação exige revisão e aprovação explícitas do original e, quando houver, de cada tradução. Depois de salvar, usar **Publicar alterações no site**. O Pages gera o HTML; o painel confirma a entrega somente quando a revisão aparece no manifesto público. Enquanto publica, aguardar antes de salvar outra alteração. Falhas do build precisam ser consultadas no Cloudflare Pages > blog > Deployments; o site anterior continua disponível.

O conteúdo editorial online passa a ser a fonte de produção. Edições feitas apenas no painel Node local ou nos Markdown do Git não substituem o D1 automaticamente. O importador inicial é idempotente: não sobrescreve um banco já inicializado. Não executar novamente para “sincronizar” alterações. Notícias e guias nunca recebem aprovação automática. Gemini continua opcional, por clique, com chave privada do projeto Free existente e sem fallback pago.

## Operação técnica

- Worker `silfontech-admin`; D1 `silfontech-editorial`. Identificadores reais em cloud-admin/wrangler.jsonc.
- `npm run cloud-admin:build`: gera assets do painel e inventário de rotas públicas.
- `npm run cloud-admin:deploy`: gera assets e publica Worker pela sessão Wrangler autenticada.
- `npx wrangler d1 migrations apply DB --remote --config cloud-admin/wrangler.jsonc`: aplica migrações.
- `node --import tsx scripts/seed-cloud-admin.ts`: prepara SQL inicial privado em .editorial-admin/cloud-seed.sql. Importação remota, quando banco vazio: `npx wrangler d1 execute DB --remote --file .editorial-admin/cloud-seed.sql --config cloud-admin/wrangler.jsonc`.
- Worker secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EDITORIAL_ADMIN_EMAILS, EDITORIAL_EXPORT_TOKEN, PAGES_DEPLOY_HOOK; opcionais GEMINI_API_KEY e EDITORIAL_AI_ENABLED. Configurar com `wrangler secret put`/`secret bulk`, nunca NEXT_PUBLIC_. Não salvar valores em código ou documentação.
- Pages blog, produção: EDITORIAL_EXPORT_URL apontando para `/internal/export` do Worker; EDITORIAL_EXPORT_TOKEN como secret com mesmo valor do Worker. Preservar NODE_VERSION. Preview não recebe esse token.
- Deploy hook Pages na branch main, nome silfontech-editorial; URL privada fica somente no secret do Worker. Reconfigurar hook/token em ambos os serviços se houver rotação. A configuração operacional privada local é ignorada em .editorial-admin/cloud-integration.json.
- GET `/internal/export` sem token retorna 401. O export completo inclui rascunhos e é destinado exclusivamente ao build privado, nunca a JavaScript dos leitores. Manifesto `/data/editorial-version.json` contém somente revisão opaca.
- Cron diário elimina sessões/contadores expirados e limita histórico às últimas 1.000 alterações globais. Histórico não substitui backup: exportar D1 antes de mudanças estruturais (`wrangler d1 export DB --remote --output <arquivo-privado> --config cloud-admin/wrangler.jsonc`) e guardar fora de public/Git.

## Limites desta etapa

Nenhum upgrade ou serviço pago foi ativado. Workers/D1/Pages estão sujeitos às cotas do plano gratuito: excedê-las pode interromper o serviço; o código não contrata capacidade adicional. Não há disponibilidade ilimitada garantida. A conta/projeto Gemini deve continuar sem faturamento, condição que a chave não permite certificar.

Produtos/comparadores, downloads de fotos Icecat e OAuth Mercado Livre continuam no processo Node local. O painel online informa essa limitação e não oferece um botão de sincronização falso. Orçamentos continuam somente no dispositivo do usuário.

A configuração do cliente Google pertence ao proprietário; salvar a URI e realizar um login real continua sendo a validação final de identidade. Testes automatizados de OAuth usam identidades sintéticas e não equivalem a entrar na conta real.
