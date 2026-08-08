# Paleta de cores

4 presets terrosos extraídos das referências, cada um com hex exatos. Use direto. Não inventar tons.

## Preset A: Bege Tan (acolhimento suave)

Usado em: peça da cadeira com sombra de planta. Mood acolhedor, luz dourada de janela.

```
Fundo principal:    #A89672  (tan médio)
Fundo claro:        #C4B294  (tan luz alta)
Fundo escuro:       #6B5D3F  (tan sombra)
Texto principal:    #F5F0E8  (branco cremoso)
Texto sobre claro:  #3E2F1F  (marrom escuro)
Handle:             #F5F0E8 a 80% opacidade
Bold/destaque:      mesmo texto principal, peso aumentado
```

Hex resumido pra colar no Figma/Canva: `A89672`, `C4B294`, `6B5D3F`, `F5F0E8`, `3E2F1F`.

## Preset B: Mostarda Âmbar (calor intenso, golden hour forte)

Usado em: peça da sombra de mão segurando flor, peça da bíblia aberta. Luz dourada quente intensa.

```
Fundo principal:    #B89455  (mostarda médio)
Fundo claro:        #D9B271  (mostarda iluminado)
Fundo escuro:       #5C3F1F  (mostarda profundo)
Texto principal:    #FFF6E2  (creme quente)
Texto sobre claro:  #5C3F1F  (marrom mostarda)
Handle:             #FFF6E2 a 80% opacidade
Bold/destaque:      mesmo texto principal, peso aumentado
```

Hex resumido: `B89455`, `D9B271`, `5C3F1F`, `FFF6E2`.

## Preset C: Dark Moody (reservado, dramático, noturno)

Usado em: peça da sombra de mão com fresta de luz. Ambiente escuro com luz cortando.

```
Fundo principal:    #2A2620  (preto quente)
Fundo médio:        #3A332A  (marrom muito escuro)
Fundo claro relativo: #5C5048 (taupe escuro)
Fresta de luz:      #C9B89A  (areia clara)
Texto principal:    #E8DDC9  (creme suave)
Texto sutil:        #C9B89A a 70%
Handle:             #C9B89A a 70% opacidade
Bold/destaque:      #FFFFFF a 90% (off-white limite)
```

Hex resumido: `2A2620`, `3A332A`, `5C5048`, `C9B89A`, `E8DDC9`.

Atenção: dark é exceção, não padrão. Use 1 de cada 5 ou 6 peças máximo, pra criar contraste no grid sem perder coesão.

## Preset D: Creme Limpo (parede clara, luz difusa)

Usado em: peça do "co • ra • gem" com sombras de folhas em parede creme. Mood arejado, leve.

```
Fundo principal:    #E8DDC9  (creme parede)
Fundo claro:        #F5EDDB  (creme alto)
Fundo médio:        #C4B294  (areia)
Texto principal:    #3E2F1F  (marrom muito escuro, quase preto)
Texto secundário:   #6B5D3F  (marrom médio)
Handle:             #6B5D3F a 70% opacidade
Bold/destaque:      #5C3F1F  (marrom mostarda escuro)
Detalhe folhas:     #B5A78F  (sombra natural)
```

Hex resumido: `E8DDC9`, `F5EDDB`, `C4B294`, `3E2F1F`, `5C3F1F`.

## Quando usar cada preset

Decisão por mood emocional:

| Mood | Preset |
|---|---|
| Acolhedor, devocional, suave | A (Bege Tan) |
| Intenso, quente, urgente | B (Mostarda Âmbar) |
| Reservado, dramático, profundo | C (Dark Moody) |
| Leve, arejado, esperançoso | D (Creme Limpo) |

Decisão por intenção do post:

| Intenção | Preset recomendado |
|---|---|
| Acolhimento / consolo | A ou D |
| Convicção / afirmação | B |
| Ensino / reflexão | A ou D |
| Manifesto / posicionamento forte | B ou C |
| Anúncio / oferta | A |

## Cores que NÃO entram

- Vermelho saturado (#FF0000 e variações).
- Verde puro (#00FF00 e variações).
- Azul royal (#0000FF e variações).
- Magenta, ciano, amarelo neon.
- Preto puro (#000000), usar #2A2620 no lugar.
- Branco puro (#FFFFFF), usar #F5F0E8 no lugar.

Cores saturadas só aparecem como elemento natural fotografado (flor real laranja na peça de 2 Coríntios). Nunca como cor sólida aplicada digitalmente.

## Coerência de grid

Pra grid coeso no Instagram, alterne presets numa sequência tipo:

```
A - B - D - A - C - A - B - D - A
```

Padrão prático:

- 50% peças no preset A.
- 25% no preset B.
- 15% no preset D.
- 10% no preset C (dark, raro).

## Como aplicar no Figma/Canva

1. Crie color styles com os 5 hex de cada preset.
2. Nomeie tipo `Bege/Fundo`, `Bege/Texto-claro`, etc.
3. Quando criar peça nova, escolhe preset e usa os styles, nunca digite hex de novo.
4. Se quiser ajustar, ajusta o color style (afeta todas as peças que usam).

No Canva: salva paleta da marca em "Hub da Marca" com esses hex.

## Como aplicar em IA de imagem

Quando gerar fundo via Nano Banana / Midjourney / Flux, especifica a paleta no prompt:

- Preset A: "warm tan beige tones, soft khaki and cream, natural plaster wall colors, Kodak Portra 400 palette"
- Preset B: "rich mustard amber tones, golden hour caramel and honey, deep ochre, warm cinnamon shadows"
- Preset C: "dark warm brown and chocolate, dim coffee tones, soft cream highlight cutting through shadows"
- Preset D: "clean cream and bone tones, soft beige plaster, neutral warm whites, pale sand"

Detalhes em `references/prompts-ia-imagem.md`.

## Frase pra lembrar

Paleta terrosa não é regra estética, é coesão de marca. Quando o seguidor vê seu post passando no feed sem ver o nome, ele sabe que é seu por causa da paleta. Cor é assinatura.
