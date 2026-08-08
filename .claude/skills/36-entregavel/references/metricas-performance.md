## Métricas de Performance

Entregável sem métrica é opinião com capa bonita. Este arquivo cobre como definir, coletar, priorizar e apresentar as métricas que justificam o valor do projeto.

## As quatro camadas de métrica

Todo projeto tem quatro camadas. Entregável bom toca todas; entregável ruim fica só nas duas de cima.

### Input (o que foi feito)
Volume de esforço, recursos aplicados.

Exemplos:
- Posts publicados.
- Horas de desenvolvimento.
- Ligações feitas.
- Testes A/B rodados.
- Emails disparados.

Cuidado: se só tem input no seu relatório, você está entregando relatório de atividade, não de performance. Cliente paga resultado, não horas.

### Output (o que saiu)
O que aconteceu por causa do input.

Exemplos:
- Alcance.
- Cliques.
- Impressões.
- Leads gerados.
- Tempo médio de resposta.
- Taxa de abertura de email.

Output é métrica intermediária. Ainda não é resultado para o cliente, mas sinaliza se o mecanismo está rodando.

### Outcome (o que mudou)
O que, no negócio, melhorou.

Exemplos:
- Receita.
- Taxa de conversão.
- Retenção.
- Ticket médio.
- CAC.
- LTV.
- NPS.
- Churn.

Outcome é a camada que o cliente sente. É o que paga a conta.

### North Star (a métrica única)
Uma métrica que resume saúde do projeto inteiro. Derivada do conceito popularizado por Sean Ellis e refinado por times como o da Amplitude.

Exemplos:
- Spotify: tempo ouvido por semana.
- Airbnb: noites reservadas.
- Para creator BR: receita mensal recorrente vinda de orgânico.
- Para shop de sapatos: receita por sessão qualificada.
- Para consultoria: NPS + faturamento do cliente pós-entrega.

Se você tiver espaço para uma só, escolha a North Star e coloque na capa.

## Como definir métrica boa

Critérios:

1. Mensurável com a infraestrutura atual do cliente. Se você não consegue medir, não é métrica, é desejo.
2. Atribuível à ação do projeto. Se sobe mesmo sem você fazer nada, não serve.
3. Com baseline antes do projeto começar. Sem "antes" não tem "depois".
4. Com meta numérica, não adjetivo. "Crescer" é adjetivo; "sair de 2% para 5%" é meta.
5. Acionável. Se a métrica subir, você sabe o que fazer mais; se cair, sabe o que corrigir.

## Como coletar

Fluxo básico:

1. Defina a métrica antes do projeto começar (parte do discovery).
2. Meça o baseline na primeira semana.
3. Defina frequência de coleta (diária, semanal, mensal).
4. Documente a fonte (analytics, planilha, CRM, API).
5. Salve os snapshots em planilha datada; não apague histórico.
6. Prepare o formato de apresentação com antecedência (evite "vou montar o gráfico na véspera").

Fontes comuns no Brasil:
- GA4 / Looker Studio.
- Meta Business Suite.
- Instagram Insights.
- Shopify / Nuvemshop / Tray.
- HubSpot / RD Station / ActiveCampaign.
- Planilha de receita do cliente.
- CRM interno (Pipedrive, HubSpot).

## Como apresentar métrica no entregável

### Regra número 1: sempre comparativo
Número sozinho não comunica. Sempre mostre:

- Baseline (antes).
- Valor atual.
- Delta absoluto e/ou percentual.
- Meta, se havia.
- Benchmark de mercado, se você conhece.

Formato enxuto:

Receita orgânica mensal: R$ 18.400 (janeiro) -> R$ 47.200 (abril). Delta: +156%. Meta era +80%.

### Regra número 2: gráfico com título-conclusão
Título do gráfico NUNCA é descritivo, sempre é uma conclusão.

Errado: "Evolução de receita mensal".

Certo: "Receita quase triplicou em 90 dias, superando meta em 76 pontos".

Esse padrão vem de McKinsey e BCG. Abre o gráfico, leitor já sabe a conclusão; depois lê detalhe só se quiser.

### Regra número 3: um gráfico por achado
Se um achado não tem um gráfico forte, ele é fraco. Se um gráfico não liga a um achado, ele é ornamento.

### Regra número 4: escala honesta
Nunca corte o eixo Y para "parecer mais dramático" sem sinalizar o corte. Cliente experiente percebe e perde confiança.

### Regra número 5: cor com função
Cor é código, não decoração. Use:

- Verde para meta batida.
- Vermelho para meta perdida.
- Azul/cinza para baseline.
- Amarelo para alerta/em andamento.

Três cores no documento inteiro bastam.

## Métricas por tipo de projeto

### Projeto de conteúdo/social
- Alcance orgânico total.
- Engajamento médio por post (salvamentos + compartilhamentos sobre alcance).
- Taxa de crescimento de seguidores qualificados.
- Cliques no link da bio.
- Receita atribuída a orgânico (quando há shop).

### Projeto de funil/conversão
- Taxa de conversão da página de captura.
- Taxa de checkout.
- Custo por aquisição.
- Receita por visitante.
- Taxa de recompra em 30/60/90 dias.

### Projeto de marca
- Reconhecimento de marca (pesquisa antes/depois).
- NPS.
- Menções orgânicas (brand search).
- Share of voice.
- Prêmio ou imprensa ganha.

### Projeto de lançamento
- Receita total.
- Carrinho abandonado e recuperado.
- Taxa de conversão do carrinho.
- ROAS.
- LTV projetado dos novos clientes.

### Projeto de consultoria estratégica
- Métrica-chave da estratégia (varia).
- Tempo economizado pelo time do cliente.
- Decisões tomadas com base no relatório.
- Receita projetada para os próximos 12 meses se seguirem o plano.

### Projeto de produto/feature
- Adoção da feature (% de usuários que usaram).
- Retenção em 7/30 dias.
- Impact on core metric (conversão, receita, retention).
- Latência/performance técnica.
- Redução de tickets de suporte relacionados.

## OKR e KPI como estrutura

### KPI
Key Performance Indicator. Métrica contínua, saúde da operação. Exemplos: MRR, CAC, NPS.

Use KPI quando: mede saúde, sempre.

### OKR
Objective and Key Result, formalizado por John Doerr em "Measure What Matters" (2018). Estrutura:

- Objective: ambição qualitativa, inspiradora.
- Key Results: 3 a 5 métricas, mensuráveis, com prazo.

Use OKR quando: define onde chegar num ciclo (trimestre/quadrimestre).

Exemplo OKR para projeto de conteúdo Luana:

- Objective: dominar busca orgânica para "sapato feminino confortável" no sudeste BR.
- KR1: 50% dos posts publicados geram 10k+ alcance orgânico.
- KR2: CTR do link da bio passa de 2,3% para 5%.
- KR3: receita atribuída a orgânico passa de R$ 18k/mês para R$ 45k/mês.

Entregável de projeto OKR-based mostra % de cumprimento de cada KR ao final.

## North Star Metric em detalhe

Características:

- Uma só.
- Reflete valor entregue ao usuário.
- Previsão de receita.
- Compreensível por qualquer pessoa do time.

Framework para achar a North Star (Amplitude):

1. Liste 5 candidatas.
2. Para cada uma, responda: se ela subir 2x, o negócio vai melhor?
3. A que passa com mais força é sua North Star.

## ROI e atribuição

### Fórmula de ROI
ROI = (Receita atribuída ao projeto - Custo do projeto) / Custo do projeto.

Exemplo:

Projeto custou R$ 30k. Receita atribuída: R$ 120k. ROI = (120k - 30k) / 30k = 3x, ou 300%.

### Cuidado com atribuição
Atribuição 100% ao seu projeto é desonesto. Seja conservador:

- Declare metodologia de atribuição (última interação, múltipla, comparação A/B).
- Mostre recorte temporal.
- Se houver outras iniciativas rodando, declare.

Cliente de longo prazo respeita honestidade; desconfia de número redondo demais.

## Métricas qualitativas

Nem tudo cabe em número. Inclua:

- Depoimentos do time do cliente.
- Observações de mudança de comportamento.
- Eventos relevantes (imprensa, parcerias, contratações possibilitadas pelo projeto).

Qualitativo ilustra; quantitativo prova.

## Apresentando limitações

Entregável honesto declara o que não mediu.

Exemplo:

"Não medimos impacto em clientes que compraram em loja física por indisponibilidade de dados POS integrados. Estimativa por regra de três: adicional de R$ 12k/mês."

Isso aumenta confiança, não reduz. Cliente experiente sempre pergunta "e o que ficou de fora?".

## Templates rápidos de apresentação

### Template bloco-métrica simples

Título da métrica (em caixa alta discreta).

[NÚMERO GRANDE]

Subtítulo com comparativo e delta.

Uma linha de contexto.

### Template tabela comparativa

| Métrica | Baseline | Meta | Resultado | Delta |
|---|---|---|---|---|
| Receita/mês | R$ 18k | R$ 35k | R$ 47k | +161% |
| Engajamento | 2,1% | 4% | 5,8% | +176% |
| Seguidores | 82k | 110k | 128k | +56% |

### Template dashboard executivo (capa)

Três números gigantes lado a lado. Cada um com delta e ícone de setinha. Abaixo, uma frase que amarra: "Projeto superou metas em receita e engajamento; crescimento de seguidores ficou 6 pontos acima do mercado".

## Erros comuns com métricas

- Mostrar só percentual quando o absoluto é pequeno (50% sobre 10 seguidores é ridículo).
- Mostrar só absoluto quando o percentual é o que impressiona.
- Não declarar fonte da métrica.
- Usar "engajamento" como termo vago.
- Comparar janelas de tempo diferentes sem avisar.
- Esconder métricas que pioraram.
- Inventar baseline retroativo.
- Medir 12 métricas quando 3 bastam.

## Frase pra lembrar

Métrica sem comparação é ruído; métrica com comparação é decisão.
