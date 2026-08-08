---
name: 42-design-posts
description: Use quando o usuário precisar produzir post estático ou carrossel para Instagram (1080x1350px). Workflow automatizado pipeline IA + código. OpenAI gpt-image-1 gera fundo limpo (sem texto). Pillow + Playfair Display + Inter aplica texto profissional via composer.py (~/Tools/compose-post.py) lendo slides-config.json. Zero erros de acento, controle total de tipografia, paleta terrosa golden hour. Estilo capturado de @seuperfil. Saída: PNGs 1080x1350 prontos pra postar, não briefing teórico.
---

# Design de Posts Estáticos Instagram

Skill operacional. Recebe input (tema, frase, versículo, afirmação, oferta) e entrega briefing executável pra produção da peça em até 30 minutos no Figma, Canva ou Photoshop.

## Quando usar

- Vai produzir 1 post estático para Instagram (1080x1350px, formato 4:5).
- Precisa peça com identidade visual coesa.
- Tem texto/frase/versículo/afirmação na mão e precisa virar arte.
- Precisa replicar estilo das referências sem cópia literal.

## Quando NÃO usar

- Vídeo, reel, story (esses pedem skill própria).
- Layout puro de marca/identidade visual (vai pra `04-ui-ux` ou design profissional).
- Frase ainda não escolhida (vai pra `23-copy` ou `38-storytelling` primeiro).

## Princípios inegociáveis

1. Fotografia, não ilustração. Fundo é sempre foto real ou foto IA realista. Nunca vetor.
2. Sombra é protagonista. A composição se sustenta pela luz e sombra do ambiente.
3. Paleta terrosa golden hour por padrão. Variação dark possível, mas excepcional.
4. Tipografia mista. Serif elegante OU sans-serif moderna. Nunca decorativa.
5. Bold seletivo. 2 a 4 palavras-chave em negrito por peça, nunca mais.
6. Texto centralizado vertical e horizontalmente em zona de baixa informação visual.
7. Handle sempre presente, topo OU rodapé, nunca ambos.
8. Espaço respira. Margem mínima de 8% de cada lado.
9. Contraste de leitura é lei. Se não dá pra ler com celular no sol, refaz.
10. Coerência > criatividade. Grid coeso vence peça brilhante isolada.
11. Texto via código, nunca via IA. gpt-image-1 e Gemini erram acentos português (Cônfiava, juntam palavras, confundem agudo/grave). Fundo é IA, texto é Pillow + fontes reais.

## Quiz de input (rodar SEMPRE antes de executar)

Antes de gerar briefing, pergunte e espere resposta. Use formato exato:

```
Pra eu produzir o post, preciso de 5 infos rápidas:

1. TEXTO PRINCIPAL: qual é a frase que vai ser o foco? (1 a 3 frases curtas)
   Se for versículo, manda referência também (ex: João 3:16).

2. INTENÇÃO: o que esse post deve provocar?
   (a) Acolhimento / consolo
   (b) Convicção / afirmação
   (c) Ensino / reflexão
   (d) Manifesto / posicionamento forte
   (e) Anúncio / oferta

3. MOOD VISUAL: escolhe 1
   (a) Bege/tan suave (luz dourada de janela em parede clara)
   (b) Mostarda/âmbar (luz quente intensa, como pôr do sol)
   (c) Marrom escuro / dark moody (ambiente reservado, sombra forte)
   (d) Creme limpo (parede clara, luz difusa, sombras de folhas)
   (e) Surpreender com algo da minha série anterior (envia link/print)

4. ELEMENTO DE FUNDO: o que aparece como sombra ou objeto principal?
   (a) Sombra de planta/folhas
   (b) Sombra de mão humana
   (c) Sombra de janela/grade
   (d) Objeto físico (cadeira, vaso, livro, bíblia, espelho, porta)
   (e) Trama/textura (linhas, fios, água)
   (f) Surpreende (você decide com base no texto)

5. HANDLE: qual o @ que aparece na peça?

Opcional:
6. PALAVRAS-CHAVE em bold: quais 2 a 4 palavras dentro do texto principal devem ficar em negrito?
   Se não disser, eu escolho.
```

Se faltar 1, peça antes de continuar. Se faltar 6, escolha você baseado em ênfase semântica natural.

## Fluxo de execução em 7 passos

### Passo 1: classificar mood

Com base na resposta do quiz item 3, escolha 1 dos 4 presets de paleta (detalhes em `references/paleta-cores.md`):

- Preset A: Bege Tan (`#A89672` médio, `#E8DDC9` claro, `#3E2F1F` texto escuro, `#F5F0E8` texto claro).
- Preset B: Mostarda Âmbar (`#B89455` médio, `#E5C88B` claro, `#5C3F1F` texto escuro, `#FFF6E2` texto claro).
- Preset C: Dark Moody (`#2A2620` fundo, `#5C5048` médio, `#E8DDC9` texto claro).
- Preset D: Creme Limpo (`#E8DDC9` fundo, `#A89672` médio, `#5C3F1F` texto escuro).

### Passo 2: escolher tipografia

Padrão (sempre uma destas combinações, detalhes em `references/tipografia.md`):

- Combo Serif Clássica: título em `Playfair Display` ou `DM Serif Display`, body em `Inter` ou `Manrope`.
- Combo Sans Moderna: título em `Manrope` ou `Inter` weight 800, body mesma família weight 400.
- Combo Mista: título serif + body sans (mais comum nas referências).

Decisão por intenção:

- Acolhimento/consolo → Combo Serif Clássica.
- Convicção/afirmação → Combo Sans Moderna weight pesado.
- Ensino → Combo Mista.
- Manifesto → Combo Sans Moderna ALL CAPS no título.
- Anúncio → Combo Mista com palavra-chave bold.

### Passo 3: definir hierarquia

Cada peça tem no máximo 4 níveis:

1. Título principal (32-56pt, peso bold ou regular dependendo da combo).
2. Texto de apoio (18-22pt, peso regular).
3. Citação fonte (versículo, autor) (14-16pt, peso medium).
4. Handle (12-14pt, peso medium).

Distribuição vertical na peça (zonas, formato 1080x1350px):

- 0% a 12%: zona segura superior (handle pode ficar aqui).
- 12% a 40%: respiro visual (sombra/foto domina).
- 40% a 75%: bloco de texto principal (centro óptico).
- 75% a 92%: respiro inferior + handle (se não estiver no topo).
- 92% a 100%: zona segura inferior.

### Passo 4: gerar fundo de imagem LIMPO (sem texto)

**Regra inegociável:** o fundo é gerado SEM TEXTO. Sempre incluir no prompt: `no text, no people, no faces`. Texto será aplicado no Passo 5 via composer.

Você tem 3 ferramentas configuradas. Escolha por contexto:

| Caminho | Quando usar | Custo | Setup |
|---|---|---|---|
| A, OpenAI gpt-image-1 MEDIUM (default) | Peça normal de feed | $0.07/img | `references/integracao-openai.md` |
| B, OpenAI gpt-image-1 HIGH (premium) | Lançamento, manifesto, peça âncora | $0.17/img | `references/integracao-openai.md` |
| C, ChatGPT Plus (DALL-E 3) | Iteração visual manual, Custom GPT, sem código | grátis (Plus) | `references/integracao-openai.md` |

**Regra fixa de qualidade:**

- NUNCA usar `low` (qualidade insuficiente pra grid coeso).
- Default = `medium` em produção normal.
- `high` apenas em peças especiais explicitamente marcadas como tal.

**Decisão automática:**

- Post regular do feed → Caminho A (medium).
- Lançamento, manifesto, peça âncora trimestral → Caminho B (high).
- Exploração visual em conversa, Custom GPT pessoal → Caminho C.

**Gemini Nano Banana Pro (opção futura):** está configurado mas exige billing ativo no Google AI Studio (free tier não inclui geração de imagem). Quando ativar billing, vira alternativa mais barata ($0.04/img). Detalhes em `references/integracao-gemini.md`.

**Estrutura base do prompt (vale pros 3 caminhos):**

```
Photographic background image, vertical 4:5 ratio, [PRESET DE PALETA],
soft golden hour light coming from [DIREÇÃO], strong cast shadow of
[ELEMENTO ESCOLHIDO NO QUIZ ITEM 4] on textured wall, cinematic mood,
shallow depth of field, no text, no people faces, generous negative
space in [POSIÇÃO DO TEXTO], subtle film grain, analog photography
aesthetic, Kodak Portra 400 color tones, 4:5 aspect ratio
```

**Fluxo Caminho A (OpenAI medium, default):**

```bash
python3 ~/Tools/openai-image.py "[prompt]" \
  ~/Downloads/posts-trabalho/[data]/fundos/[tema]-v1.png medium gpt-image-1
```

1. Monte o prompt preenchendo placeholders com respostas do quiz.
2. Rode o comando acima (qualidade `medium`).
3. Avalie (sombra dramática, paleta correta, espaço pro texto, sem rosto/texto inventado).
4. Se não passar, ajuste prompt e regenere (1-2 ajustes resolvem).

**Fluxo Caminho B (OpenAI high, premium):**

```bash
python3 ~/Tools/openai-image.py "[prompt]" \
  ~/Downloads/posts-trabalho/[data]/fundos/[tema]-v1.png high gpt-image-1
```

Reserve para: lançamento, manifesto, peça âncora trimestral, capa de carrossel especial.

**Fluxo Caminho C (ChatGPT Plus):**

Manual: abra seu Custom GPT "Design Posts Instagram", cole o prompt + "Generate in 2:3 vertical format". Salve a imagem retornada.

**Pré-requisitos:**

- `OPENAI_API_KEY` configurada (Caminhos A e B).
- Conta ChatGPT Plus ativa (Caminho C).
- `GEMINI_API_KEY` configurada com billing (opcional, futuro).

### Passo 5: aplicar texto via composer (workflow profissional)

Esse passo automatiza a aplicação de texto sobre o fundo via Pillow + fontes reais. Zero erros de acento, controle pixel-perfeito de tipografia. Detalhes em `references/composer-pillow.md`.

**Pré-requisitos (já configurados):**

- `~/Tools/compose-post.py` (composer principal)
- `~/Tools/fonts/PlayfairDisplay-Italic.ttf`, `PlayfairDisplay.ttf`, `Inter.ttf`
- Pillow instalado (`python3 -c "from PIL import Image"`)

**Fluxo:**

1. Crie `slides-config.json` na pasta do projeto com array de objetos, um por slide. Cada slide tem:

```json
{
  "bg": "/caminho/bg-1.png",
  "out": "/caminho/slide-1.png",
  "title_lines": ["Linha 1 do título", "Linha 2"],
  "title_size": 92,
  "subtitle_lines": ["LINHA 1 SUBTITULO", "LINHA 2 SUBTITULO"],
  "subtitle_size": 24,
  "subtitle_tracking": 3,
  "body_lines": ["Corpo linha 1.", "Corpo linha 2.", "", "Linha após espaço."],
  "body_size": 32,
  "y_start": 180,
  "gap_after_title": 60,
  "handle": "@HANDLE",
  "handle_size": 28,
  "handle_tracking": 6,
  "handle_y": 1180
}
```

2. Rode o composer:

```bash
python3 ~/Tools/compose-post.py /caminho/slides-config.json
```

3. Output: PNGs 1080x1350 prontos pra postar nos paths definidos em `out`.

**Convenções de tamanho:**

- Título grande (1-2 palavras): 92-110pt Playfair Italic
- Título médio (frase 1 linha): 78-92pt
- Título pequeno (frase 2-3 linhas): 60-78pt
- Subtítulo (UPPERCASE tracked): 22-28pt Inter, tracking 3
- Body (corpo serif): 26-36pt Playfair Regular
- Handle: 26-30pt Inter UPPERCASE, tracking 6

**Convenções de quebra:**

- `title_lines` força quebras manuais (preferido pra controle).
- `body_lines` aceita string vazia `""` pra criar parágrafo.
- Sem `_lines`, o composer faz word wrap automático.

### Passo 5b: refinamento manual (opcional)

Pra peças âncora que precisam ajuste fino: abre o PNG no Figma como background, sobrepõe overlay sutil onde texto compete com fundo, ajusta micro-tracking. Use só quando a saída do composer não basta. 90% das peças não precisam.

### Passo 6: checklist de saída

Rodar `references/checklist-qualidade.md` antes de postar. 12 itens. Se falhar em 2+, refazer.

### Passo 7: arquivar e postar

Output do composer já é 1080x1350 PNG sRGB pronto pra Instagram. Sem etapa de export.

- Mover pra `~/Drive/PostsInstagram/AAAA-MM/` ou pasta de arquivamento.
- Nome do arquivo: `[YYYY-MM-DD]-[tema-curto]-slide-N.png`.
- Postar via Meta Business, Later, Buffer, ou direto no celular.

## Anatomia padrão (resumo visual)

```
┌─────────────────────────────────┐  ← 1080px
│                                 │
│         @handle                 │  ← topo (opcional)
│                                 │
│                                 │
│       [SOMBRA / FOTO]           │
│      [ÁREA DE RESPIRO]          │
│                                 │
│                                 │
│   Frase principal com           │
│   palavra em **bold**.          │  ← bloco texto centro
│                                 │
│   Apoio em fonte menor.         │
│                                 │
│   Versículo ou fonte            │
│                                 │
│                                 │
│       [SOMBRA / FOTO]           │
│                                 │
│         @handle                 │  ← rodapé (se não no topo)
│                                 │
└─────────────────────────────────┘
                                       ← 1350px
```

## Variações por intenção

Detalhes em `references/templates-prontos.md`. Resumo:

- Versículo bíblico: serif clássica, 2 partes (versículo + referência), sombra de elemento natural.
- Afirmação curta: sans bold em 2-3 linhas, palavra-chave em negrito, fundo dramático.
- Ensino/reflexão: 3 blocos (frase impacto + parágrafo + conclusão), serif + sans.
- Manifesto/posicionamento: ALL CAPS gigante, fundo dark, contraste alto.
- Definição de palavra: estilo dicionário (`co • ra • gem`) com bullets e parágrafo.
- Acolhimento: tom suave, light, sombras delicadas.
- Anúncio/oferta: hierarquia clara, CTA destacado em caixa.

## Anti-padrões críticos

Detalhe em `references/checklist-qualidade.md`. Resumo:

1. Fundo gradient genérico do Canva. Sempre foto.
2. Mais de 4 níveis hierárquicos. Confunde leitura.
3. Texto em cima de área visualmente cheia. Falta contraste.
4. Bold em mais de 4 palavras. Perde o destaque.
5. Tipografia decorativa (script, brush) na frase principal. Ilegível.
6. Centralizado mais centralizado e centro centralizado. Variar alinhamentos quebra coesão.
7. Handle invisível. Sempre legível, mas discreto.
8. Mais de 2 fontes diferentes. Vira festa.
9. Saturação alta. Quebra a paleta terrosa.
10. Stock photo óbvio. Use Unsplash curado, IA realista, ou foto própria.

## Handoff com outras skills

- Texto da peça vem de: `23-copy`, `24-copy-revisar`, `38-storytelling`.
- Estratégia de qual peça postar quando: `29-social-media-instagram`, `41-lancamento-operacional`.
- Posicionamento que sustenta voz visual: `40-posicionamento-marca`.
- Discovery do público que vai consumir: `34-discovery-cliente`.

## Recursos complementares

- `references/estilo-visual.md`: identidade visual completa capturada das referências (mood, luz, composição, recorrências).
- `references/anatomia-post.md`: estrutura de cada peça em detalhes (zonas, blocos, margens).
- `references/tipografia.md`: combos de fontes, hierarquia, pesos, leading.
- `references/paleta-cores.md`: 4 presets terrosos com hex exatos + variações.
- `references/templates-prontos.md`: 8 templates baseados nas referências, prontos pra duplicar no Figma.
- `references/prompts-ia-imagem.md`: prompts prontos pra Nano Banana, Midjourney, Flux.
- `references/integracao-gemini.md`: integração automática com `gemini-imagegen` (Nano Banana Pro), setup, parâmetros, troubleshooting.
- `references/integracao-openai.md`: integração com OpenAI gpt-image-1 (medium/high) e ChatGPT Plus.
- `references/composer-pillow.md`: composer Python que aplica texto profissional via Pillow + Playfair Display + Inter sobre fundos limpos. Schema completo do `slides-config.json`, exemplos por tipo de peça, troubleshooting.
- `references/checklist-qualidade.md`: 12 checks antes de exportar.
- `references/workflow-execucao.md`: passo a passo operacional do briefing à exportação final.

## Frase pra lembrar

Post bom não é o mais bonito, é o que para o scroll com mensagem clara. Sombra é a alma da peça. Tipografia é o corpo. Texto é o motivo de tudo existir.

---

## Regra de travessão

Nenhum texto gerado por esta skill pode conter travessão (—) no que o cliente final vê. Use vírgula, ponto ou parênteses no lugar.
