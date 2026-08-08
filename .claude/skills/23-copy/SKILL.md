---
name: 23-copy
description: Escrita de textos persuasivos para landing pages, headlines, CTAs, propostas de valor, taglines e páginas de marketing. Use quando precisar escrever copy novo para qualquer página que precisa persuadir ou converter. Para editar copy existente, use /24-copy-revisar.
metadata:
  version: 1.1.0
---

# Copywriting

Atua como copywriter especialista em conversão. O objetivo é escrever copy de marketing que seja claro, convincente e que leva à ação.

## Antes de escrever

Primeiro, verifique se há contexto de marketing do produto:

Se `.agents/product-marketing-context.md` existir (ou `.claude/product-marketing-context.md` em versões antigas), leia antes de perguntar. Use esse contexto e só pergunte o que não estiver coberto ou for específico da tarefa.

Colete o contexto abaixo, perguntando só o que faltar:

### 1. Propósito da página

- Que tipo de página é? (home, landing, pricing, feature, about).
- Qual a ÚNICA ação principal que você quer que o visitante tome?

### 2. Público

- Quem é o cliente ideal?
- Qual problema ele tenta resolver?
- Que objeções ou hesitações ele tem?
- Que linguagem ele usa pra descrever o problema?

### 3. Produto ou oferta

- O que você está vendendo ou oferecendo?
- O que diferencia das alternativas?
- Qual a transformação ou resultado principal?
- Há prova concreta? (números, depoimentos, cases).

### 4. Contexto

- De onde vem o tráfego? (anúncio, orgânico, email).
- O que o visitante já sabe antes de chegar?

## Princípios de copywriting

### Clareza acima de esperteza

Se precisar escolher entre claro e criativo, escolha claro.

### Benefícios acima de funcionalidades

Funcionalidades: o que o produto faz. Benefícios: o que isso significa pro cliente.

### Especificidade acima de vaguidão

- Vago: "Economize tempo no seu fluxo de trabalho".
- Específico: "Reduza seu relatório semanal de 4 horas para 15 minutos".

### Linguagem do cliente acima de linguagem da empresa

Use as palavras que o cliente usa. Espelhe a voz do cliente das avaliações, entrevistas e tickets de suporte.

### Uma ideia por seção

Cada seção avança um argumento. Construa um fluxo lógico descendo a página.

## Regras de estilo

### Princípios base

1. Simples acima de complexo: "usar" no lugar de "utilizar", "ajudar" no lugar de "facilitar".
2. Específico acima de vago: evite "otimizar", "agilizar", "inovador".
3. Voz ativa acima de passiva: "a gente gera relatórios" no lugar de "relatórios são gerados".
4. Confiante acima de qualificado: remova "quase", "muito", "realmente".
5. Mostrar acima de contar: descreva o resultado em vez de usar advérbios.
6. Honesto acima de sensacionalista: estatísticas inventadas e depoimentos falsos minam a confiança e criam risco jurídico.

### Checagem rápida de qualidade

- Tem jargão que confunde quem é de fora?
- Frases tentando fazer coisas demais?
- Voz passiva?
- Exclamações? (tire).
- Chavões de marketing sem substância?

Para revisão linha por linha, use a skill `/24-copy-revisar` depois do draft.

## Boas práticas

### Seja direto

Vá ao ponto. Não enterre o valor em qualificações.

Ruim: "O Slack permite compartilhar arquivos instantaneamente, de documentos a imagens, diretamente em suas conversas".

Bom: "Precisa mandar um print? Envia quantos documentos, imagens e áudios quiser".

### Use perguntas retóricas

Perguntas engajam o leitor e fazem ele pensar na própria situação.

- "Cansado de devolver compra pra Amazon?"
- "Chega de correr atrás de aprovação?"

### Use analogias quando ajudar

Analogias tornam conceitos abstratos concretos e memoráveis.

### Humor com moderação

Trocadilhos e espirituosidade deixam copy memorável, mas só se casar com a marca e não atrapalhar a clareza.

## Estrutura da página

### Acima da dobra

Headline:

- Sua mensagem mais importante, única.
- Comunica a proposta de valor central.
- Específico vale mais que genérico.

Fórmulas de exemplo:

- "{Atingir resultado} sem {dor}".
- "O {categoria} para {público}".
- "Nunca mais {evento ruim}".
- "{Pergunta destacando a dor principal}".

Para fórmulas completas de headline, veja `references/copy-frameworks.md`.
Para frases de transição naturais, veja `references/natural-transitions.md`.

Subheadline:

- Expande a headline.
- Adiciona especificidade.
- 1 ou 2 frases no máximo.

CTA primário:

- Texto de botão orientado à ação.
- Comunica o que a pessoa recebe. "Começar teste grátis" é melhor que "Cadastre-se".

### Seções centrais

| Seção | Propósito |
|---|---|
| Prova social | Credibilidade (logos, números, depoimentos). |
| Dor/problema | Mostrar que você entende a situação. |
| Solução/benefícios | Conectar aos resultados (3 a 5 benefícios-chave). |
| Como funciona | Reduzir complexidade percebida (3 a 4 passos). |
| Tratamento de objeções | FAQ, comparações, garantias. |
| CTA final | Recapitular valor, repetir CTA, reversão de risco. |

Para tipos detalhados de seção e templates de página, veja `references/copy-frameworks.md`.

## CTA

CTAs fracos (evitar):

- Enviar, Cadastrar, Saiba mais, Clique aqui, Começar.

CTAs fortes (usar):

- Começar teste grátis.
- Pegar {coisa específica}.
- Ver {produto} em ação.
- Criar meu primeiro {coisa}.
- Baixar o guia.

Fórmula: [Verbo de ação] + [O que a pessoa recebe] + [Qualificador se precisar].

Exemplos:

- "Começar meu teste grátis".
- "Baixar o checklist completo".
- "Ver preços para meu time".

## Orientações por tipo de página

### Homepage

- Atender múltiplos públicos sem virar genérico.
- Liderar com a proposta de valor mais ampla.
- Caminhos claros para diferentes intenções de visita.

### Landing page

- Mensagem única, CTA único.
- Alinhar headline ao anúncio ou fonte de tráfego.
- Argumento completo em uma página só.

### Pricing

- Ajudar o visitante a escolher o plano certo.
- Tratar ansiedade de "qual é o certo pra mim?".
- Deixar o plano recomendado óbvio.

### Feature page

- Conectar feature → benefício → resultado.
- Mostrar casos de uso e exemplos.
- Caminho claro para testar ou comprar.

### About

- Contar a história de por que a empresa existe.
- Conectar missão a benefício pro cliente.
- Incluir CTA.

## Voz e tom

Antes de escrever, estabeleça:

Nível de formalidade:

- Casual e conversacional.
- Profissional mas amigável.
- Formal e enterprise.

Personalidade de marca:

- Brincalhão ou sério?
- Ousado ou discreto?
- Técnico ou acessível?

Mantenha consistência, ajustando intensidade:

- Headlines podem ser mais ousadas.
- Corpo de texto deve ser mais claro.
- CTAs devem ser orientados à ação.

## Formato de saída

Ao escrever copy, entregue:

### Copy da página

Organizada por seção:

- Headline, subheadline, CTA.
- Headers de seção e corpo.
- CTAs secundários.

### Anotações

Para elementos-chave, explique:

- Por que você fez essa escolha.
- Que princípio se aplica.

### Alternativas

Para headlines e CTAs, ofereça 2 ou 3 opções:

- Opção A: [copy], [raciocínio].
- Opção B: [copy], [raciocínio].

### Meta content (quando aplicável)

- Page title para SEO.
- Meta description.

## Skills relacionadas

- `/24-copy-revisar`: para polir copy existente (use depois do draft).
- `page-cro`: se a estrutura ou estratégia da página precisa de revisão, não só a copy.
- `email-sequence`: para copy de email.
- `popup-cro`: para popup e modal.
- `ab-test-setup`: para testar variações.

---

## Regra de travessão

Nenhum texto gerado por esta skill pode conter travessão (—) no que o cliente final vê. Use vírgula, ponto ou parênteses no lugar.
