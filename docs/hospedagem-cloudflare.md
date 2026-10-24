# SilfonTech no Cloudflare gratuito

Domínio adquirido no Registro.br: `silfontech.com.br`. Origem pública: `https://silfontech.com.br`. Consultas em 23/10/2026: NS `a.auto.dns.br` e `b.auto.dns.br`, sem registro A no domínio raiz e www inexistente. Nenhum DNS alterado nesta preparação.

## Domínio e DNS

1. Criar/abrir a conta Cloudflare, adicionar `silfontech.com.br` e selecionar o plano Free. Não registrar/comprar o domínio novamente nem transferir o registrador.
2. Cloudflare fornecerá dois nameservers específicos da conta/zona. Copiar exatamente esses nomes, sem usar exemplos de terceiros.
3. No Registro.br, abrir o domínio, DNS, Alterar servidores DNS e informar os dois nameservers fornecidos. Conferir eventuais registros de e-mail antes da troca para preservá-los.
4. Aguardar Cloudflare indicar zona ativa. A troca da delegação DNS é necessária para usar o domínio raiz no Pages; o domínio continua registrado no Registro.br.
5. Depois da implantação, no projeto Pages, Custom domains, associar primeiro `silfontech.com.br` e seguir as instruções de DNS/TLS do serviço. Adicionar www se desejado e configurar redirecionamento para o domínio raiz. Não criar CNAME para um nome pages.dev presumido: o destino precisa ser o projeto realmente criado.

## Site público

O projeto já usa export estático Next.js. Pages suporta esse formato, domínio próprio e HTTPS no plano gratuito, sujeito às cotas. Build: `npm run build`; diretório de saída `out`; quando usar Git, branch `main`, repositório `JVsilveira/blog`. O comando inclui validação e finalização, por isso não usar apenas `npx next build`. Respeitar engines Node/npm de package.json. Variável pública de produção: `NEXT_PUBLIC_SITE_URL=https://silfontech.com.br`. Indexação é configuração separada da compra do domínio e segue as regras de revisão de conteúdo.

Atenção operacional: catálogo e fotos Icecat são runtime ignorado pelo Git. Um build remoto somente do repositório não terá esses arquivos locais. Para preservar a comparação real, publicar o export completo pelo Wrangler Direct Upload/CI com artefatos autorizados ou implementar distribuição própria do catálogo. Não colocar segredos/cache privado no repositório. Ainda não há fluxo de atualização remota configurado.

Inventário local aproximado em 23/10/2026: export com 13.430 arquivos, 318 MB, nenhum arquivo acima de 25 MiB. Pages Free permite até 20.000 arquivos por site e 25 MiB por arquivo. O catálogo está crescendo e deve ser medido novamente antes de cada publicação. Upload por arrastar no navegador não atende esse volume (limite de 1.000 arquivos); usar Wrangler ou CI. Não habilitar R2 ou upgrade pago para contornar limites sem autorização.

## Painel e automações

O painel existente depende de Node, disco gravável/persistente, subprocessos de build e sincronização contínua. Pages estático não executa isso. Publicar o site público não publica o painel e não mantém a sincronização local rodando na nuvem. Por enquanto o painel continua local. Uma migração para Workers/D1 exige adaptação de persistência, jobs e publicação, com avaliação das cotas Free; não foi implementada nem assumida como funcionando. Não alterar callbacks Google/Mercado Livre para o domínio público até existir o painel realmente hospedado.

## Referências oficiais

- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/platform/limits/

## Falha com OpenNext na criação pelo painel

Se o log mostrar `npx opennextjs-cloudflare build` e falhar na geração do bundle após o Next listar as rotas, o serviço está usando o adaptador dinâmico. Esse não é o fluxo do export estático do projeto (`output: export`). Criar o projeto pela opção Pages, preset Next.js (Static HTML Export), build `npm run build`, saída `out`, raiz do repositório, branch main. Não selecionar o preset Next.js dinâmico/OpenNext. Se o formulário exigir Deploy command com Wrangler/OpenNext, verificar se foi aberta a criação de Worker em vez de Pages. O trecho de log recebido em 23/10/2026 não inclui a exceção original do adaptador; não atribuir erro específico de cache/arquivo sem o log completo.

## Deploy público confirmado e falha do DNS local (23/10/2026)

Deploy informado: https://5dbda95d.blog-16e.pages.dev; alias de produção https://blog-16e.pages.dev. DNS da rede consultada (45.167.189.15) devolveu 127.0.0.1 para os dois hosts, causando conexão recusada. DNS público Google por HTTPS devolveu 172.66.44.199 e 172.66.47.57. Verificação com curl --resolve, mantendo hostname/SNI e validação TLS, confirmou em ambos os hosts: /, /noticias/, /celulares/comparar/ e /robots.txt HTTP 200; rota inexistente HTTP 404. HTML apresenta marca SilfonTech e noindex; ainda não habilitado SEO público. Evidência aponta resolução DNS local incorreta/filtrada, sem demonstrar qual equipamento ou provedor a causou. Não foi alterado DNS do computador/roteador. Orientar teste em rede móvel e resolvedor seguro do navegador antes de alterar publicação ou domínio.

## Administração online — atualização de 23/10/2026

Painel editorial agora tem Worker e D1 separados do Pages estático, sem contratação de plano pago. Postagens/autores/fontes persistem online e o build de produção importa snapshot autenticado. Configuração, callback Google, publicação e limites em [painel-cloudflare](editorial/painel-cloudflare.md). O painel Node local permanece para sincronização Icecat e Mercado Livre.
