# Validação 10A — 22/10/2026

Estado: núcleo validado nos checks locais abaixo, com aceite parcial de QA. **Não publicável; não publicado.** Esta etapa não executa 10B de PCs, celulares ou orçamentos. As ferramentas existentes foram preservadas e seus testes de domínio entram na suíte, sem nova certificação E2E delas.

## Resultado e evidências

Ambiente Node 26.12.0, npm 12.2.1, Next 16.4.2, Chromium local, sem dependências novas. Pré-requisitos técnicos 02/03/04/08/09 presentes. Zero produtos aprovados e dois artigos draft. Institucionais em revisão, origem null, robots Disallow /, noindex e sitemap vazio preservados. Git não reconhece o diretório; nenhum commit foi presumido.

| Check efetivamente executado | Resultado |
| --- | --- |
| `npm test` | 93 testes aprovados; primeira tentativa restrita teve EPERM em subprocesso, repetição com execução local permitida passou |
| `npm run typecheck`, `npm run lint` | Aprovados |
| `npm run build`, `npm run smoke` | Export aprovado; drafts e inexistentes com 404; fixtures ausentes |
| `npm run test:blog-export` | HTML de artigos e paginação, busca só publicados; fixture em /tmp |
| `npm run test:recommendations-export` e `-- --preview` | Detalhe, arquivado, draft ausente e link comum; preview em output separado |
| `npm run audit:export` | 16 HTML; destinos, âncoras e assets locais presentes; sem recurso HTML externo |
| Negativas do auditor em /tmp | Destino inexistente, âncora inexistente e script externo recusados |
| Preview HTTP via urllib | /, /ajuda/, índice JSON 200 e MIME correto; ausente 404 com HTML do projeto e nosniff |
| Chromium: 9 rotas × 6 larguras | 320/360/390/768/1024/1440 sem overflow; um h1/main por página; nenhum pageerror ou request externo |
| Teclado | Skip link foca main; menu contém Tab/Shift+Tab, Escape fecha e devolve foco |
| Busca | Vazia, limpar, falha de índice simulada e nova tentativa com sucesso; não envia termo |
| Sem JS | Home e listagens legíveis; draft retorna HTTP 404; artigos/detalhes em HTML comprovados nos exports isolados |
| Fluxo positivo sintético | Artigo → recomendação relacionada → CTA por Enter; destino interceptado com resposta local, nenhum request à loja |
| Reduced motion / ampliação | Transição computada 0s; texto raiz 200% em viewport 720×450 sem overflow; não equivale a zoom completo 200% |

Rotas da matriz: `/`, `/ajuda/`, `/recomendacoes/`, `/sobre/`, `/contato/`, `/metodologia/`, `/afiliados/`, `/privacidade/`, `/termos/`. Draft testado: `/ajuda/backup-antes-de-configurar/`; smoke cobre demais slugs inválidos/draft. Capturas `output/playwright/stage10-home-390.png` e `stage10-terms-1440.png` inspecionadas; relatório `stage10-matrix.txt` e jornada `stage10-journey.txt`. Captura ampliada: `stage10-text-200.png`. Esses artefatos são locais/ignorados; regenerar após alterações.

Contraste calculado por luminância sRGB dos pares usados: texto/background 15,98:1; muted/surface 8,30:1; link/surface 6,72:1; branco/botão 6,70:1; muted/elevated 7,47:1. Não é auditoria automática integral de contraste. Sem leitor de tela, Firefox/Safari, axe ou zoom completo do navegador. Console: warnings de preload CSS e erro esperado do índice abortado; nenhum erro funcional observado na matriz.

Correção: Termos negavam existência dos orçamentos. Texto atualizado para descrever uso local e responsabilidade pelos valores, preservando rascunho/noindex. Preview anterior usava servidor genérico em todas as interfaces e 404 genérico; `scripts/preview.py` restringe loopback, serve 404 do projeto, não lista diretórios e fornece MIME/headers básicos. Não é servidor de produção.

## Segurança básica e desempenho

Inspecionados schemas de URL, renderizador Markdown, safeJson, flags, analytics e referências de rede. HTTPS sem credenciais nos contratos; HTML arbitrário não é executado; JSON-LD escapa `<`; única chamada fetch do núcleo é índice local. Nenhuma chave pública secreta identificada na busca estática; isso não prova ausência universal de segredos. Eventos estritos/no-op e anúncios inertes cobertos por testes. Auditor percorre href/src do HTML, não executa JS, não valida srcset/CSS/links remotos nem autentica fontes/licenças. Não foi enviada árvore de dependências a registry (`npm audit` remoto não executado devido à restrição de envio a terceiros); revisão atual de advisories permanece pendente externa, sem alegação de vulnerabilidade inexistente.

Baseline total do export: 21 JS, 237.597 bytes gzip somados individualmente; imagens 19.401 bytes. Total não representa transferência inicial por rota. Orçamento inicial de revisão: até 300 KiB gzip de JS total do núcleo e 200 KiB por imagem editorial; acima disso medir antes de otimizar. Ferramentas: teto provisório 350 KiB gzip por entrada com dependências compartilhadas, a medir em cada 10B; não aferido aqui. Não são garantias de performance. Imagens futuras exigem dimensões, variantes e direitos reais.

Lighthouse não está instalado localmente e não foi instalado para esta revisão; diagnóstico pendente. Para medição reproduzível futura: mesma versão de Chrome/Lighthouse registrada, export em loopback, perfil mobile, sem extensões, três execuções com mediana, cache frio e depois quente; guardar JSON/HTML por rota editorial e registrar CPU/rede. LCP ≤2,5s e CLS ≤0,1 são metas, sem resultado aferido nesta etapa. INP ≤200ms exige dados de campo; não existe evidência de campo/tráfego. Não publicar pontuação inventada.

## Preview e release portátil

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run smoke
npm run audit:export
npm run serve:export
```

Abrir http://127.0.0.1:4173; Ctrl+C encerra. O servidor lê somente out. Nunca servir raiz do projeto nem publicar output/*-preview. Produção usa exclusivamente out após o build completo, incluindo finalizador. Não usar next start.

Antes de preparar release público: resolver bloqueadores abaixo, confirmar origem HTTPS em site.ts e revisar approvedPaths/indexingApproved manualmente; previews mantêm indexação desligada. Flags comerciais continuam desligadas até requisitos reais. Congelar fonte, lockfile, versão Node/npm, checks, data, responsável, commit quando Git estiver restaurado e SHA256 do artefato. Gerar arquivo local com `tar -czf /tmp/portal-tech-release.tgz -C out .` e `sha256sum /tmp/portal-tech-release.tgz`; manter cópia anterior fora de out antes de novo build. Não incluir rascunhos fonte, dependências, .env ou dados privados. Não houve release enviado nesta etapa.

Provedor ainda não escolhido: João deve verificar termos comerciais e cotas atuais do plano gratuito, TLS, logs, privacidade, custo, limites e mecanismo de rollback. Só então preparar instruções específicas desse provedor e autorizar deploy. Não há provedor presumidamente contratado/gratuito nem autorização de publicação.

Alternativa para quem já dispõe de host estático Nginx: servir conteúdo de uma pasta de release por ponteiro `current`; configurar `index index.html`, `try_files $uri $uri/ =404` e `error_page 404 /404.html` (sem =200 e sem fallback SPA). Root aponta apenas para o export. Configuração ilustrativa, não aplicada/testada em Nginx. Incluir MIME types e HTTPS no host. Redirecionar host alternativo para origem canônica confirmada. HTML, JSON, sitemap/robots e payloads de navegação devem revalidar; chunks com nome hash podem usar public/max-age=31536000/immutable. Conservar releases anteriores e evitar remover chunks enquanto HTML antigo estiver em cache.

Headers: nosniff, strict-origin-when-cross-origin, X-Frame-Options DENY e CSP com frame-ancestors 'none', object-src 'none', base-uri 'self'; definir política script-src a partir dos hashes exatos de todos scripts inline do export, renovados a cada build, e fontes locais. Não aplicar script-src self isoladamente: quebraria hidratação. Testar CSP primeiro em Report-Only sem endpoint externo, revisar violações localmente e então aplicar. Não habilitar ads para contornar política. Preview não certifica CSP/TLS/cache reais.

Após autorização e implantação externa futura, testar URLs diretas, inexistente com HTTP 404 e página correta, redirects, MIME, cache, headers, busca, teclado, sem JS e ausência de terceiros. Registrar artefato/commit/horário e evidências reais. Se falhar, restaurar release anterior íntegro pelo mecanismo do provedor/ponteiro do servidor, invalidar cache HTML/payloads e repetir smoke. Se primeiro release, retirar acesso público ou voltar a manutenção previamente aprovada. Não reconstruir conteúdo antigo usando dados atuais como rollback; preservar artefato. Nenhum banco é migrado; orçamentos locais permanecem no dispositivo, sem importar/exportar dados privados automaticamente. Antes de eventual mudança de armazenamento, orientar exportação voluntária pelo usuário.

## Bloqueadores e decisão

- **Editorial/humano:** marca/contato/perfil e políticas aprovadas; primeiro conjunto de conteúdo e recomendações reais revisados. Oito artigos é meta ajustável, não requisito mágico nem autorização para inventar.
- **Infra/operacional:** origem/host e termos comerciais, Git/backup/restauração, TLS/headers/cache/404 e rollback reais; aprovação explícita de publicação.
- **QA local pendente:** Lighthouse, zoom completo 200%, leitor de tela e revisão adicional de navegadores. Revalidar export após cadastro real, inclusive fluxo comercial real e imagens autorizadas.
- **Externos opcionais:** afiliados reais exigem conta/links/termos aprovados para monetizar; AdSense e analytics não bloqueiam núcleo e permanecem inativos.

Núcleo pronto para revisão local; não há aceite completo de lançamento, publicabilidade nem publicação.

## Experimento após lançamento autorizado

Dia zero é a data real de publicação, ainda inexistente. Nos primeiros 30 dias, João/revisor ajustam meta de até oito artigos revisados ao tempo disponível, confirmam recomendações e preparam uma peça de distribuição por artigo em uma rede escolhida; enviar/publicar depende de autorização própria. Sem tráfego pago inicial e sem promessa de receita. Preencher docs/metricas.csv somente com horas/custos e dados efetivamente disponíveis; ausência de coleta não é zero visitas, clique não é venda e comissão aprovada não é dinheiro recebido.

Revisão em 30 dias: avaliar páginas, intenção, origem de descoberta, cliques e manutenção. Poucas visitas pedem teste de distribuição; visitas sem saída pedem revisão de intenção/contexto; cliques sem venda pedem apuração da oferta/atribuição. Aos 60–90 dias, manter/ampliar tema com evidência, reposicionar distribuição ou pausar conforme custo real. Sem limiar universal de conversão. Priorizar blog útil; cada ferramenta entra em 10B somente se solicitada e justificada por demanda e custo de dados. Não transformar estimativas de esforço do plano em promessa de data.

Próximo prompt: “Retome a 10A, confira as aprovações reais fornecidas por João, resolva os bloqueadores locais restantes e revalide o export, sem publicar nem ativar terceiros.” Para 10B indicar explicitamente a ferramenta e usar prompts/10-validacao-lancamento-roadmap.md; nenhum módulo adicional está automaticamente autorizado.

Referências oficiais consultadas em 22/10/2026: [Next static exports](https://nextjs.org/docs/app/guides/static-exports), [Nginx try_files/error_page](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files), [MDN script-src e hashes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src). A exportação em out e sem recursos de servidor segue Next; resolução de arquivo/404 segue Nginx; hashes CSP precisam corresponder exatamente aos scripts. Configuração do host continua pendente de verificação real.
