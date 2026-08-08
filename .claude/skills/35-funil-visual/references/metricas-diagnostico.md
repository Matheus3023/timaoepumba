# Métricas e diagnóstico de gargalo

Funil sem métrica é fé religiosa. Você acha que funciona porque quer que funcione. Este arquivo dá o essencial pra medir e diagnosticar.

## O princípio das 2 métricas por etapa

Toda etapa tem:

- Volume: quantas pessoas entram.
- Conversão: % que avança pra próxima.

Sem uma das duas, você não consegue diagnosticar. Volume sem conversão mostra se tem tráfego. Conversão sem volume mostra se a etapa funciona. Só com as duas você sabe se a receita está saudável.

## Métricas macro do funil inteiro

Essas são indicadores de saúde geral, não de uma etapa específica.

### CAC (Custo de Aquisição de Cliente)

Fórmula: (investimento em marketing + vendas) / número de clientes novos no período.

O que olhar:

- CAC por canal (não média).
- Payback period: em quantos meses o cliente paga o CAC.
- CAC/LTV ratio.

Benchmark:

- SaaS saudável: payback 12 meses ou menos.
- Ecommerce DTC: payback 1 a 3 meses.
- Infoproduto: payback no primeiro pedido (CAC menor que ticket).

### LTV (Lifetime Value)

Fórmula simples: ticket médio x frequência de compra x duração do relacionamento.

Fórmula pra SaaS: ARPU / churn mensal.

O que olhar:

- LTV 12 meses (mais prático que "vida toda").
- LTV por segmento (nem todo cliente tem mesmo valor).

Benchmark: LTV/CAC saudável é 3x ou mais. Abaixo de 1x, queima dinheiro.

### Payback period

Tempo pra recuperar o investimento feito pra adquirir o cliente.

Benchmark:

- Excelente: menos de 6 meses.
- Saudável: 6 a 12 meses.
- Apertado: 12 a 18 meses.
- Ruim: 18+ meses.

### North Star Metric

Origem: Sean Ellis.

1 métrica única que resume o valor que você entrega. Exemplos:

- Airbnb: noites reservadas.
- Spotify: tempo total de escuta.
- Slack: mensagens enviadas por equipe ativa.
- Uber: corridas completadas.

O que olhar: essa métrica sobe todo mês? Se não, tem problema estrutural.

### MRR, ARR, GMV

Para SaaS e assinatura: MRR (Monthly Recurring Revenue), ARR (Annual).

Para marketplace e ecommerce: GMV (Gross Merchandise Value).

Compare com mês anterior (MoM growth) e ano anterior (YoY).

## Métricas por etapa (benchmarks generalistas)

Valores médios de mercado. Usa como referência pra detectar anomalia grande, não como meta absoluta.

### Topo de funil (Awareness)

- CTR de anúncio: 0,5% a 3% (varia muito por plataforma e criativo).
- CPM: R$ 15 a R$ 80 no Brasil (Meta, TikTok).
- Engajamento em post orgânico: 1% a 5% do alcance.
- CR de visita pra lead (landing de lead magnet): 20% a 40%.

Sinais de problema:

- CTR abaixo de 0,5%: criativo ruim ou segmentação errada.
- CPM muito acima da média do seu mercado: concorrência brutal ou ads com baixo score.
- CR landing abaixo de 15%: headline não bate com o anúncio ou falta clareza.

### Meio de funil (Consideration)

- Open rate de email: 20% a 35%.
- CTR de email: 2% a 5%.
- Taxa de abertura de WhatsApp: 60% a 85%.
- CR de email clique pra ação: 5% a 15%.
- Taxa de comparecimento em webinar ao vivo: 25% a 50%.

Sinais de problema:

- Open rate abaixo de 15%: lista fria ou assunto ruim.
- CTR de email abaixo de 1%: oferta ou CTA fraco.
- Comparecimento de webinar abaixo de 20%: sequência de lembretes insuficiente.

### Fundo de funil (Decision)

- CR de webinar pra venda: 3% a 10%.
- CR de landing pra checkout: 2% a 6%.
- CR de checkout pra pagamento: 60% a 80%.
- CR de trial SaaS pra pago: 2% a 15%.
- CR de call comercial pra fechamento: 15% a 40%.

Sinais de problema:

- Checkout pra pagamento abaixo de 50%: UX quebrada, carrinho lento, fricção.
- Trial pra pago abaixo de 2%: produto não entrega valor rápido ou preço errado.

### Pós-venda (Retention)

- Recompra ecommerce 60 dias: 15% a 30%.
- NPS: 50+ é bom, 70+ é excelente.
- Churn SaaS: abaixo de 5% ao mês é saudável.
- Net Revenue Retention (NRR): alvo 100%+, expansion saudável 110%+.

Sinais de problema:

- Churn acima de 8% ao mês: produto não entrega valor recorrente.
- NPS abaixo de 30: cliente não recomenda, palavra de boca negativa.

## Upsell, bump, downsell

Ordem de agressividade na thank-you page:

- Bump (checkout): 20% a 40% aceitam.
- Upsell 1 (thank you page): 10% a 30% aceitam.
- Upsell 2 (downsell): 5% a 15% aceitam.

Sinais de problema:

- Bump abaixo de 15%: não é complementar ou preço desproporcional.
- Upsell 1 abaixo de 10%: oferta grande demais ou pouco conectada.

## Como diagnosticar gargalo (processo)

Passo 1: monte a planilha do funil.

Cada linha uma etapa. Colunas: volume de entrada, volume de saída, CR, custo, receita gerada por etapa.

Passo 2: identifique a etapa com maior queda.

Calcula drop rate: 1 - (saída/entrada). A etapa com maior drop relativo é o gargalo.

Passo 3: compara com benchmark.

Se a CR está dentro da faixa mediana pro seu mercado, a etapa está ok. Se está abaixo, problema de mensagem, oferta, UX, canal.

Passo 4: investiga a causa.

4 hipóteses comuns por etapa:

Topo:

- Criativo fraco (testa 5 variações).
- Público errado (revisita segmentação).
- Landing quebrada em mobile (testa fisicamente).
- Promessa não bate entre ad e landing.

Meio:

- Lead frio demais (não é persona certa).
- Sequência chata ou genérica.
- Canal que não usa (envia email pra quem só usa WhatsApp).

Fundo:

- Falta de prova (pouco depoimento, pouco caso).
- Preço desalinhado com percepção.
- Fricção de pagamento.
- Objeção não endereçada.

Pós-venda:

- Produto não entrega a promessa.
- Onboarding fraco.
- Cliente não percebe valor.

Passo 5: testa 1 hipótese por vez.

Não troca 5 coisas ao mesmo tempo. Você não vai saber o que funcionou.

## Dashboards mínimos

Pra monitorar sem enlouquecer:

### Dashboard 1: tráfego e aquisição

- Visitas únicas por canal.
- Taxa de rejeição.
- Custo por lead por canal.
- Volume de leads novos.

Ferramentas: Google Analytics 4, Meta Ads Manager, Ads Manager do canal.

### Dashboard 2: conversão e receita

- Leads totais.
- Oportunidades (calls, checkouts iniciados).
- Vendas fechadas.
- Ticket médio.
- Receita do período.

Ferramentas: CRM (HubSpot, Pipedrive, RD Station), Stripe/Kiwify/Hotmart.

### Dashboard 3: retenção

- Churn.
- LTV atualizado.
- NPS recente.
- Recompra 30/60/90 dias.

Ferramentas: ChurnZero, Vitally, Mixpanel, ou planilha manual se volume pequeno.

## Cadência de revisão

- Diário (5 min): tráfego, leads, vendas do dia.
- Semanal (30 min): saúde de funil, conversões por etapa, alerta de gargalo novo.
- Mensal (2h): análise profunda, comparação com benchmarks, decisões de ajuste.
- Trimestral (meio dia): revisão estratégica, redesenho de etapas, realinhamento de oferta.

Sem cadência, dashboard vira enfeite.

## Alertas e limites

Configure alertas automáticos para:

- CAC acima de X% do ticket médio.
- CR de checkout caiu X% em 24h.
- Churn semanal acima de Y.
- Queda brusca de tráfego orgânico.

Ferramentas: Zapier, Make, ou a própria plataforma de ads.

## Atribuição (o problema)

Cookie deprecation, iOS 14+, LGPD. Atribuição determinística está acabando.

Alternativas modernas:

- Atribuição por modelo (data-driven attribution no GA4).
- Pesquisa pós-compra: "como você nos conheceu?".
- Incrementality test: liga desliga canal e mede efeito real.
- UTM bem organizado desde o início.

Verdade: 100% atribuição nunca existiu. Agora é mix de dados e entrevista com cliente.

## Métricas que parecem importantes mas enganam

- Alcance bruto: grande sem qualidade não paga conta.
- Seguidor: segue por hábito, não por intenção de compra.
- Impressão: ser visto não é ser percebido.
- Tempo no site: pode indicar interesse ou confusão.
- Abertura de email sozinha: iOS distorce esse número desde 2021.
- Engajamento em post: curtida não vira cliente.

Concentra em métricas de intenção (clique em CTA, agendamento, checkout iniciado, pagamento).

## Frase pra lembrar

Métrica serve pra decisão, não pra decoração. Se você olha um número e não sabe o que fazer com ele, tira do dashboard.
