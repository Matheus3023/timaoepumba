# Prompts de IA para Revisão Crítica

Dez prompts testados pra usar com Claude, GPT ou outro modelo de linguagem quando o tempo é curto e a pessoa quer rodar uma revisão crítica sozinha. Cada prompt traz objetivo, quando usar, texto pronto pra copiar e dica de interpretação.

A IA não substitui revisor humano, mas serve como primeira camada. Ela é boa em listar vieses, aplicar frameworks e simular papel adversário. Ruim em captar contexto de mercado específico, relação com cliente real e sutileza cultural.

A lógica de uso é simples. Primeiro você escreve o plano em uma mensagem. Depois roda o prompt. A IA responde. Você compara com o que já tinha na cabeça. A parte nova é onde tá o valor.

## Prompt 1. Red Team Completo

### Objetivo

Simular time adversário que ataca o plano de 3 ângulos. Concorrente, cliente, sistema.

### Quando usar

Revisão de lançamento, entrada em mercado, posicionamento novo. Usa antes de executar decisão de impacto alto.

### Texto pronto

Você é um time de Red Team experiente, com mandato único de destruir o plano abaixo. Não suavize, não pondere, não proponha alternativa. Só ataque.

Plano. [cole aqui o plano em 5 a 10 linhas].

Entregue sua análise em três camadas.

Camada 1. Ataque do concorrente. Como um concorrente inteligente reage nas próximas 4 semanas e neutraliza esse plano?

Camada 2. Ataque do cliente. Qual a objeção real que o cliente vai ter e que o plano não respondeu? Lista 5 objeções com a frase que o cliente usaria.

Camada 3. Ataque do sistema. Qual regra de plataforma, algoritmo, regulação ou contexto macro pode travar o plano?

Pra cada ataque, indique severidade de 1 a 5 e se o plano sobrevive, precisa ajuste ou precisa redesenho.

### Dica de interpretação

Ataques de severidade 4 e 5 sem resposta no plano são bloqueadores. Trate como obrigatório ajustar antes de executar.

## Prompt 2. Pre-Mortem

### Objetivo

Imaginar que o plano fracassou e listar causas em ordem de probabilidade.

### Quando usar

No meio do planejamento, antes de fechar a decisão. Especialmente útil quando o plano parece óbvio demais.

### Texto pronto

Aplique o framework Pre-Mortem de Gary Klein ao plano abaixo.

Plano. [cole aqui o plano].

Premissa do exercício. Assumimos que se passaram 90 dias e o projeto foi um fracasso absoluto. A empresa perdeu dinheiro, tempo e credibilidade.

Entregue.

Primeiro. Escreva a manchete do fracasso em uma linha.

Segundo. Liste 15 causas prováveis do fracasso, agrupadas em 4 categorias. Oferta, operação, psicologia, mercado.

Terceiro. Pra cada causa, estime probabilidade de 0 a 100% e impacto de 1 a 5.

Quarto. Liste as 5 mais críticas (probabilidade vezes impacto) e sugira ação preventiva específica pra cada.

### Dica de interpretação

As 5 causas críticas viram checklist obrigatório de mitigação. Se não for possível mitigar uma delas, o plano precisa redesenho estrutural.

## Prompt 3. Devil's Advocate

### Objetivo

Construir argumento mais forte possível contra o plano, sem caricatura.

### Quando usar

Quando a pessoa tá convicta demais. Quando o time tá alinhado demais. Quando a ideia foi elogiada por todos.

### Texto pronto

Você é Advogado do Diabo. Seu papel é construir o caso mais forte possível contra o plano abaixo. Não a versão caricata, a versão sofisticada. Como se o plano fosse levado a um conselho de investidores céticos com 30 anos de experiência.

Plano. [cole aqui].

Entregue.

Primeiro. Tese contrária central em uma frase.

Segundo. Cinco argumentos lógicos estruturados que apoiam a tese contrária. Cada argumento com premissa, evidência (quando possível) e conclusão.

Terceiro. Qual a pergunta fatal que, se não tiver resposta forte, o plano morre?

Quarto. Qual o cenário no qual o plano atual seria, na verdade, a pior escolha possível?

Use tom firme, não insultuoso. Ataque a ideia, não quem tem a ideia.

### Dica de interpretação

A pergunta fatal geralmente expõe a premissa mais frágil. Responda com evidência, não com argumento.

## Prompt 4. Inversão de Munger

### Objetivo

Usar inversão mental pra encontrar o que evitar.

### Quando usar

Quando o plano tá complexo e você quer simplificar. Quando precisa decidir o que não fazer.

### Texto pronto

Aplique a inversão mental de Charlie Munger, também conhecida como invert always invert.

Plano. [cole aqui].

Pergunta central. Se o objetivo fosse garantir o fracasso desse plano, qual seria a receita?

Entregue.

Primeiro. Dez passos específicos que garantiriam o fracasso do plano.

Segundo. Pra cada passo, avalie se o plano atual contém traços desse passo.

Terceiro. Liste 5 coisas que o plano precisa parar de fazer ou evitar explicitamente.

Quarto. Traduza a lista em regras operacionais claras. Formato. A gente não vai fazer X porque Y.

### Dica de interpretação

A lista de regras operacionais é o output principal. Cola na parede, vira filtro de decisão durante execução.

## Prompt 5. Six Thinking Hats

### Objetivo

Forçar análise multi-perspectiva em sequência.

### Quando usar

Decisão estratégica complexa. Também útil em solo pra quem tende a ficar só no chapéu preto (crítica) ou só no amarelo (otimismo).

### Texto pronto

Aplique os Six Thinking Hats de Edward de Bono ao plano abaixo. Responda cada chapéu separadamente, sem misturar.

Plano. [cole aqui].

Chapéu Branco (dados e fatos). Quais fatos verificáveis sustentam ou contradizem o plano? O que ainda não sabemos e precisaríamos saber?

Chapéu Vermelho (emoção e intuição). Qual o cheiro desse plano? O que o instinto sugere sem justificar?

Chapéu Preto (crítica e risco). Onde o plano falha? Qual o pior cenário realista?

Chapéu Amarelo (benefício). Por que esse plano seria brilhante se der certo? O que está em jogo em termos de recompensa?

Chapéu Verde (criatividade). Qual alternativa existe? Se tivesse que mudar o plano radicalmente, qual caminho?

Chapéu Azul (processo). Qual o próximo passo lógico depois dessa análise? Quais decisões ficam pendentes?

### Dica de interpretação

Compare o preto com o amarelo. Se os dois pesam muito, o plano tem potencial e risco em escala similar, precisa ajuste. Se preto domina, redesenha. Se amarelo domina, reforça mitigação.

## Prompt 6. Caça-Vieses

### Objetivo

Detectar quais vieses cognitivos estão agindo na decisão.

### Quando usar

Quando a decisão parece óbvia demais. Quando você tá pessoalmente envolvido no plano.

### Texto pronto

Analise o plano abaixo pra detectar vieses cognitivos que podem estar influenciando a decisão. Não elogie o plano. Foque em onde o raciocínio pode estar enviesado.

Plano. [cole aqui].

Avalie presença de cada um dos 12 vieses. Pra cada um, diga se há evidência forte, fraca ou nenhuma.

1. Confirmation bias
2. Sunk cost fallacy
3. Planning fallacy
4. Survivorship bias
5. Availability heuristic
6. Anchoring
7. Dunning-Kruger
8. Optimism bias
9. Groupthink
10. Status quo bias
11. Endowment effect
12. Narrative fallacy

Pra os vieses com evidência forte, cite o trecho específico do plano que sugere o viés e proponha como neutralizar.

### Dica de interpretação

Se mais de 4 vieses aparecem com evidência forte, o plano precisa de uma rodada adicional de análise, preferencialmente com alguém externo.

## Prompt 7. Five Whys Aplicado

### Objetivo

Testar a solidez da premissa central descendo por causas até achar fato ou opinião nua.

### Quando usar

Quando o plano tem uma ideia central que parece óbvia. Quando você sente que falta fundamentação.

### Texto pronto

Aplique o Five Whys de Sakichi Toyoda à premissa central do plano abaixo.

Plano. [cole aqui].

Premissa central identificada. [escreva a premissa que você quer testar].

Execute 5 rodadas de por quê, começando por essa premissa. Cada pergunta aprofunda a anterior.

Ao final, avalie se a cadeia chegou em um fato verificável, em uma opinião sem evidência ou em um viés conhecido.

Se chegou em fato, a premissa é sólida. Se chegou em opinião ou viés, a premissa é frágil e precisa validação antes de executar.

### Dica de interpretação

O resultado do Five Whys é uma estimativa de quão forte é a base do plano. Premissa frágil não mata o plano, mas exige teste antes de investimento.

## Prompt 8. Assimetria de Risco

### Objetivo

Quantificar a assimetria entre ganho potencial e perda potencial.

### Quando usar

Decisão que envolve investimento significativo. Decisão com alto potencial de retorno mas risco não trivial.

### Texto pronto

Analise a assimetria de risco do plano abaixo usando o framework de Nassim Taleb.

Plano. [cole aqui].

Entregue.

Primeiro. Ganho máximo realista se der certo. Em números, com premissas claras.

Segundo. Perda máxima realista se der errado. Em números, com premissas claras.

Terceiro. Tempo pra colher o resultado positivo. Tempo pra materializar a perda.

Quarto. Probabilidade subjetiva de cada cenário.

Quinto. A assimetria é favorável, simétrica ou desfavorável? Por quê?

Sexto. A perda máxima é sobrevivível? Se quebrar, quebra o negócio inteiro ou só um braço?

### Dica de interpretação

Plano bom tem assimetria favorável. Ganho muito maior que perda, com perda contida. Plano onde a perda máxima quebra o negócio inteiro é apostar tudo no vermelho, independente do ganho potencial.

## Prompt 9. Decisão em Uma Frase

### Objetivo

Forçar clareza. Se a pessoa não consegue escrever em uma frase, o plano ainda não amadureceu.

### Quando usar

Quando a decisão parece nebulosa. Quando você tá explicando o plano pela terceira vez e o ouvinte não entendeu.

### Texto pronto

Leia o plano abaixo e sintetize em uma única frase no formato. Nós vamos [ação específica] pra [público-alvo específico] com [oferta ou proposta específica] investindo [recursos específicos] em [prazo específico] esperando [resultado mensurável].

Plano. [cole aqui].

Se alguma lacuna não puder ser preenchida com especificidade, sinalize explicitamente qual lacuna e o que falta definir antes.

Depois, aponte os 3 ajustes mais importantes que a síntese revelou sobre o plano original.

### Dica de interpretação

A lista de lacunas é o principal output. Lacuna é sinal de que o plano ainda não tá pronto pra execução, precisa decisão prévia.

## Prompt 10. Revisão Final Pré-Publicação

### Objetivo

Checklist rápido de 10 perguntas antes de apertar publicar.

### Quando usar

Últimas 2 horas antes do lançamento ou publicação.

### Texto pronto

Você é revisor crítico sênior com 15 anos de experiência em lançamentos digitais no Brasil. Analise o plano abaixo e responda as 10 perguntas fundamentais. Seja brutal, objetivo, sem enrolação.

Plano. [cole aqui].

1. A decisão tá escrita em uma frase clara e mensurável?
2. Quais as 3 premissas mais críticas e quais foram verificadas?
3. O que acontece se a premissa mais crítica for falsa?
4. Qual o pior cenário realista e o responsável sobrevive a ele?
5. Alguém externo viu e criticou antes de publicar?
6. Qual o custo de esperar 30 dias pra publicar?
7. A decisão tá sendo tomada com energia ou com evidência?
8. Como saber se deu errado rápido?
9. Qual o ponto de saída?
10. Essa decisão é reversível?

Responda cada pergunta em até 3 linhas. Ao final, dê o veredicto em uma linha. Go, Go com ajustes, ou No-go e redesenho.

### Dica de interpretação

Respostas curtas sem contexto indicam que o plano ainda tem lacunas. Veredicto No-go é para ser tomado como sinal de alarme, não como ofensa. Agradece a IA e redesenha.

## Dicas gerais pra trabalhar com IA em revisão crítica

Dica 1. Contexto importa mais que prompt. Antes de rodar qualquer prompt, descreva público, produto, canal, histórico. Sem contexto, a IA responde em genérico e perde valor.

Dica 2. Se a resposta da IA for vaga, peça específico. Vale a resposta que cita trecho do seu plano, aponta número e cita exemplo.

Dica 3. Use a IA em múltiplas passagens, não só uma. Primeiro Red Team, depois Pre-Mortem, depois Caça-Vieses. Cada passagem revela ângulo diferente.

Dica 4. Descarte o que não aplica. A IA pode apontar riscos genéricos que não servem no seu contexto. Filtrar é parte do trabalho.

Dica 5. Não peça resposta neutra. A IA tende a equilibrar. Peça explicitamente tom adversário quando for Red Team ou Devil's Advocate.

Dica 6. Se a resposta for elogiosa, desconfie. A IA é treinada pra ser educada. Em revisão crítica, você quer o contrário. Reforce o pedido. Ataque mais. Encontre 3 furos que você ainda não apontou.

Dica 7. Registre a sessão. Salva input e output. Vira acervo pra decisões futuras.

## Frase pra lembrar

IA não revisa por você. IA amplia a sua revisão. Quem não revisa direto, amplia o nada.
