# Prompts de IA pra análise de perfil

Prompts prontos pra usar com Claude, ChatGPT, Gemini ou Perplexity. Copie, adapte, cole. Sempre valide a saída em fonte primária, pois LLM pode inventar.

## Prompt 1: análise individual de perfil

Use quando tiver prints do grid + 10 legendas recentes de 1 perfil.

```
Você é um estrategista de marca. Vou te passar informações de um perfil que estou analisando em pesquisa competitiva.

CONTEXTO:
- Meu nicho: [SEU NICHO]
- Meu público-alvo: [SEU PÚBLICO]
- Meu posicionamento atual: [SEU POSICIONAMENTO]

PERFIL ANALISADO:
- Handle: @[HANDLE]
- Plataforma: [INSTAGRAM/TIKTOK/LINKEDIN]
- Bio: [COLAR BIO]
- 10 legendas recentes: [COLAR 10 LEGENDAS]

ME DÊ UMA ANÁLISE ESTRUTURADA:

1. Posicionamento em 1 frase (qual promessa esse perfil faz?).
2. Arquétipo de marca dominante (entre os 12 de Jung/Mark & Pearson) com justificativa.
3. Tom de voz em 4 eixos (Formal-Casual, Sério-Divertido, Respeitoso-Irreverente, Entusiasta-Objetivo). Pontue 1 a 5 em cada.
4. 3 pilares de conteúdo recorrentes.
5. Padrão de gancho (quais tipos de abertura se repetem?).
6. Padrão de CTA.
7. Força principal.
8. Fraqueza principal.
9. O que eu posso APRENDER sem copiar.
10. O que eu devo EVITAR replicar.

Responda em português BR, frases curtas, sem travessões longos, sem asteriscos de negrito. Seja específico, não genérico.
```

## Prompt 2: extrair tom de voz em massa

Use quando tiver 20-30 legendas coladas.

```
Analise o tom de voz das legendas abaixo. Extraia:

1. 5 palavras que se repetem (excluindo artigos, preposições).
2. 3 bordões ou frases típicas.
3. Comprimento médio em palavras.
4. Estrutura predominante (pergunta, afirmação, narrativa, lista).
5. Uso de emoji (muito, médio, nenhum, quais predominam).
6. Nível de formalidade (1 a 5, 1 = casualíssimo, 5 = formalíssimo).
7. Presença de gírias regionais (quais, se tiver).
8. Tom emocional dominante (1 palavra).

Legendas:
[COLAR LEGENDAS NUMERADAS DE 1 A N]

Responda em português BR, sem travessões longos, sem bold.
```

## Prompt 3: matriz comparativa

Use depois de analisar 4-6 perfis individualmente.

```
Vou te passar análises de [N] perfis que fiz no nicho [NICHO]. Monte uma matriz comparativa.

PERFIL 1: [cole resumo de 1 página]
PERFIL 2: [cole resumo de 1 página]
...
PERFIL N: [cole resumo]

MONTE EM FORMATO DE TABELA MARKDOWN:

| Dimensão | Perfil 1 | Perfil 2 | ... | Perfil N |
|---|---|---|---|---|
| Posicionamento | | | | |
| Tom dominante | | | | |
| Formato principal | | | | |
| Pilar central | | | | |
| Estética | | | | |
| Ticket médio (se visível) | | | | |
| Gancho padrão | | | | |
| CTA padrão | | | | |
| Diferencial claro | | | | |

Depois da tabela, responda:

1. Qual padrão aparece em 4+ perfis? (regras do jogo do nicho).
2. Qual exceção aparece em 1-2 perfis? (oportunidade possível).
3. O que NENHUM perfil está fazendo? (vazio do nicho).
4. 3 hipóteses pra eu testar, baseadas nessa análise.

Português BR, frases curtas, sem travessões longos.
```

## Prompt 4: análise de grid visual

Use quando puder colar imagens (Claude, GPT-4V, Gemini). Ou descreva textualmente.

```
Vou te mandar print do grid (últimos 12 posts) de um perfil.

Analise:

1. Paleta de cores dominante (2 a 3 cores).
2. Paleta secundária (1 a 2 cores de apoio).
3. Tipo de composição (centralizada, assimétrica, cheia, minimalista).
4. Presença de texto sobre imagem (sempre, às vezes, nunca).
5. Se texto: tipografia (serifada, sans-serif, manuscrita).
6. Iluminação predominante (natural, estúdio, dramática, flat).
7. Tratamento de cor (limpo, saturado, desbotado, filme, preto-branco).
8. Padrão de enquadramento (retrato, paisagem, close, plano geral).
9. Consistência visual (1 a 5, 1 = aleatório, 5 = marca sólida).
10. Arquétipo estético em 1 palavra (minimalista, orgânico, glamouroso, técnico etc).

Contexto meu: [SEU NICHO E ESTILO ATUAL].

Depois me diga: que 3 elementos visuais eu posso absorver e adaptar? Que 2 eu devo evitar porque são assinatura do perfil analisado?

Português BR, sem travessões, sem bold.
```

## Prompt 5: identificar oportunidade de oceano azul

Use depois de já ter matriz comparativa pronta.

```
Vou te passar uma matriz comparativa de [N] perfis do nicho [NICHO].

[COLAR MATRIZ]

Aplique o framework ERRC (Blue Ocean Strategy) pra mim:

ELIMINAR: o que o mercado todo faz que eu posso ELIMINAR sem prejuízo?
REDUZIR: o que eu posso REDUZIR abaixo do padrão do mercado?
REFORÇAR: o que eu posso REFORÇAR acima do padrão?
CRIAR: o que eu posso CRIAR que NENHUM concorrente oferece?

Pra cada, me dê 2 a 3 exemplos concretos e específicos pro nicho.

Depois, sintetize em 1 frase: qual seria meu posicionamento diferenciado possível?

Contexto meu:
- Quem sou: [SEU CONTEXTO]
- O que ofereço: [SUA OFERTA]
- Pra quem: [PÚBLICO]

Português BR, frases curtas, sem travessões longos.
```

## Prompt 6: arquetipar concorrentes

Use pra classificar todos concorrentes em arquétipos de Jung.

```
Classifique cada perfil abaixo em 1 dos 12 arquétipos de Jung (Margaret Mark & Carol Pearson):

Innocent, Explorer, Sage, Hero, Outlaw, Magician, Regular Guy, Lover, Jester, Caregiver, Creator, Ruler.

Dê arquétipo principal + arquétipo secundário (se aplicável) + justificativa em 2 frases.

PERFIS:
1. @[HANDLE 1]: [descrição resumida do perfil].
2. @[HANDLE 2]: [descrição].
...

Depois me diga:

- Qual arquétipo está LOTADO no nicho?
- Qual arquétipo está VAZIO?
- Se meu estilo natural é [SEU ESTILO], qual arquétipo faria mais sentido eu ocupar?

Português BR, sem travessões longos, frases curtas.
```

## Prompt 7: gerar hipóteses acionáveis

Use pra transformar análise em ações concretas.

```
Baseado na análise de benchmark que fiz, gere 5 hipóteses testáveis.

CONTEXTO:
- Meu negócio: [DESCRIÇÃO].
- Achado principal da análise: [EXEMPLO: "todos concorrentes usam linguagem técnica, ninguém usa storytelling pessoal"].
- Minha restrição: [tempo, dinheiro, equipe disponível].

Pra cada hipótese, me dê:

- Nome curto da hipótese.
- Premissa (o que eu acho que vai acontecer).
- Ação concreta (o que vou fazer pra testar).
- Métrica de sucesso (como vou saber que funcionou).
- Prazo pra testar (em semanas).

Hipóteses priorizadas da mais barata pra mais cara de testar.

Português BR, sem travessões, sem bold.
```

## Prompt 8: extrair padrão de gancho

Use pra descobrir por que reels do concorrente viralizam.

```
Abaixo estão os 10 reels mais engajados de um concorrente. Pra cada um, extraia:

1. Tipo de gancho (contradição, número, curiosidade, confissão, inimigo, pergunta, resultado+tempo, outro).
2. Primeiras 2 linhas do texto do vídeo (ou legenda se o vídeo for menção).
3. Gatilho emocional dominante (curiosidade, medo, desejo, raiva, surpresa, pertencimento).

Reels (título ou descrição + legenda):
1. [DADO]
2. [DADO]
...
10. [DADO]

Depois sintetize:

- Quais 2 tipos de gancho se repetem mais?
- Qual gatilho emocional é constante?
- Qual fórmula eu poderia adaptar (sem copiar) pro meu conteúdo?

Português BR, frases curtas.
```

## Prompt 9: analisar estrutura de funil do concorrente

Use quando tiver seguido a jornada completa (perfil > bio > landing).

```
Vou descrever o funil de um concorrente que analisei. Me ajude a desenhar o funil dele e comparar com o meu.

FUNIL DO CONCORRENTE:
- Canal topo: [DESCRIÇÃO].
- Bio aponta pra: [LINK E O QUE TEM LÁ].
- Landing faz: [CAPTURA, VENDA, VSL, ETC].
- Oferta: [R$ X, formato, duração, garantia].
- Pós-compra: [O QUE VI OU INFERI].

MEU FUNIL ATUAL:
[DESCREVA RESUMIDO]

ME DIGA:

1. Desenhe o funil do concorrente em ASCII (caixas com setas).
2. Desenhe meu funil em ASCII.
3. Compare: onde ele é mais sofisticado?
4. Onde ele é mais fraco?
5. 3 melhorias que eu poderia implementar inspirado nele.

Português BR, sem travessões.
```

## Prompt 10: síntese final do benchmark

Use no final, depois de toda análise individual e comparativa.

```
Você é meu estrategista. Com base em tudo que analisei (colado abaixo), escreva a síntese final do meu benchmark.

MATERIAL:
[COLE MATRIZ + ANÁLISES INDIVIDUAIS + ACHADOS ERRC]

ESCREVA UM DOCUMENTO DE 1 A 2 PÁGINAS COM:

1. Resumo executivo em 1 parágrafo.
2. Lista dos perfis analisados com classificação (direto, indireto, aspiracional etc).
3. 5 padrões recorrentes do nicho.
4. 3 oportunidades não exploradas.
5. Meu posicionamento possível em 1 frase (baseado em ERRC).
6. 3 hipóteses pra testar nas próximas 4 semanas.
7. O que ADOTAR, ADAPTAR, EVITAR (listas curtas).
8. Riscos: o que pode dar errado se eu seguir essas hipóteses?

Tom: profissional mas acessível. Frases curtas. Sem travessões longos. Sem asteriscos de negrito. Português BR humanizado.
```

## Dicas de uso de IA pra benchmark

1. Cole dado bruto, não interprete antes. Deixe a IA interpretar.
2. Dê contexto seu (seu nicho, público, posicionamento). Sem isso, análise fica genérica.
3. Peça formato específico (tabela, lista, ASCII). Obriga IA a estruturar.
4. Valide toda citação e número. IA inventa.
5. Não use IA pra escrever seu posicionamento final. Use pra esclarecer seu pensamento, você decide.
6. Use 2 IAs diferentes pra mesma tarefa e compare. Divergência = ponto pra revisar manualmente.

## Limitações da IA em benchmark

- Não acessa perfil em tempo real (exceto Perplexity, Exa, alguns plugins).
- Não vê imagens a menos que você envie (Claude, GPT-4V, Gemini fazem).
- Inventa números se pressionada ("qual o faturamento do perfil X?" vai gerar chute).
- Não substitui julgamento. Analisa, mas não decide por você.

## Fluxo recomendado

1. Coleta manual (você).
2. Análise individual com IA (prompt 1 por perfil).
3. Matriz comparativa com IA (prompt 3).
4. ERRC com IA (prompt 5).
5. Arquetipagem (prompt 6).
6. Hipóteses (prompt 7).
7. Síntese final (prompt 10).

Total de uso de IA: ~2 horas se bem organizado.

## Frase pra lembrar

IA é ferramenta de leitura rápida. Quem vê o padrão real ainda é você. IA acelera análise, não substitui intuição treinada.
