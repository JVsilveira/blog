# 10 — Validação, lançamento e evolução do negócio

## Resultado
Consolidar publicação revisável, procedimento de deploy e indicadores do experimento. Executar em dois momentos: 10A após núcleo 02/03/04/08/09; 10B após cada ferramenta. Não atrasar núcleo esperando catálogo universal.

## Roadmap por entregas, estimativas de esforço
Estimativas de planejamento para uma pessoa, incluindo revisão, com incerteza alta e sem contar cadastro extenso:
- Fundação/arquitetura: 12–24 h.
- Blog e fluxo editorial: 12–24 h, mais 2–5 h por artigo original pesquisado.
- Recomendações/catálogo: 8–16 h, mais 1–3 h por produto para pesquisa e curadoria.
- Monetização inativa/SEO/QA do núcleo: 12–24 h.
- PCs 5A: 10–20 h + pesquisa das configurações; 5B: 30–60 h + dados/regras.
- Celulares: 20–40 h + 1–3 h por variante verificada.
- Orçamentos: 20–40 h incluindo cálculos, privacidade e impressão.
Não somar esses números e prometer uma data. IA acelera código, mas revisão, distribuição e dados continuam custando tempo. Se disponível 8–12 h/semana, replanejar o núcleo conforme conteúdo e qualidade reais; não assumir lançamento de tudo em 30 dias.

## Experimento após lançamento
Primeiros 30 dias públicos: 8 artigos revisados como meta editorial ajustável, recomendações confirmadas e pelo menos um conteúdo de distribuição para cada artigo em uma rede escolhida. Cadastro de afiliados quando site e canais estiverem preparados; aprovação externa registrada. Sem tráfego pago inicial. Rastrear horas, custos, visitas, cliques, vendas aprovadas e dinheiro recebido. Sem vendas não prova sozinho fracasso: distinguir falta de visitas, intenção errada e problema na oferta.

A cada 30 dias: identificar páginas com audiência e intenção, melhorar as melhores e testar distribuição. Aos 60–90 dias: manter/ampliar um tema com sinais, mudar posicionamento/distribuição se há pouca descoberta, ou pausar se esforço não se justifica. Decisões por evidência suficiente; não inventar um limite universal de sessões/conversão. AdSense é complemento e aprovação não é meta técnica controlável.

## Checklist técnico de lançamento
Build, typecheck e lint; testes do motor de domínio e formulários relevantes; E2E de leitura→recomendação→saída, busca, 404 e navegação móvel. Testar HTML exportado sem JS em artigos e detalhes. Rotas diretas no servidor estático. Testar 320/360/390/768/1024/1440 px, teclado, foco, contraste, zoom 200% e reduced motion. Lighthouse como diagnóstico em ambiente reproduzível; metas de projeto para páginas editoriais: LCP ≤2,5 s, CLS ≤0,1 e INP ≤200 ms quando dados de campo existirem; laboratório não comprova INP de campo. Orçamento inicial JS de ferramentas e imagens documentado; otimizar onde medição indicar. Anúncios futuros exigem nova avaliação.

## Checklist editorial/comercial
Nome e contato confirmados; textos institucionais revisados; nenhum draft, mock, link #, depoimento falso ou produto sem origem; imagens autorizadas; recomendações pessoais confirmadas; links de afiliado reais e divulgados; domínio ou subdomínio e condições do host verificados; ads desligados se não aprovados; privacidade coerente com trackers reais. Não habilitar publicação só porque build passou.

## Deploy e rollback
Preparar instruções do provedor e alternativa de servidor estático. Configurar variáveis públicas, origem canônica, redirects/404 e cache; preview de produção para revisão. Deploy público é passo posterior autorizado pelo proprietário, sem contratar domínio ou plano automaticamente. Registrar commit/artefato, data e checklist. Rollback para artefato anterior, preservar conteúdo e não migrar dados privados sem exportação. Nenhuma chave secreta no bundle. Documentar manutenção de domínio e contas se adotados.

## Aceite final
Entregar relatório dos checks executados, URLs/rotas testadas, bloqueadores externos e pendências editoriais; separar “núcleo pronto localmente”, “publicável” e “publicado”. Não relatar receita ou aprovação inexistentes. Reavaliar ferramentas pela demanda e custo de manter dados, não pelo volume de funcionalidades.
