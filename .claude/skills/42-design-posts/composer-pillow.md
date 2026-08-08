# Composer Pillow, texto profissional sobre fundo

Componente que aplica texto sobre fundos limpos via Pillow + Google Fonts. Foi criado pra resolver o problema de gpt-image-1/Gemini errarem acentos em português ("Cônfiava", "PROHADO", "vocè"). Texto via código nunca erra.

## Stack

- `~/Tools/compose-post.py`: composer principal
- `~/Tools/fonts/PlayfairDisplay-Italic.ttf`: títulos serif italic
- `~/Tools/fonts/PlayfairDisplay.ttf`: corpo serif regular
- `~/Tools/fonts/Inter.ttf`: subtítulo/handle sans
- Pillow (PIL): renderização

## Uso

```bash
python3 ~/Tools/compose-post.py /caminho/slides-config.json
```

O composer lê o JSON, processa cada slide do array, salva PNGs nos `out` paths. Output: 1080x1350 PNG sRGB.

## Schema do slides-config.json

Array JSON. Cada elemento é um slide com este formato:

```json
{
  "bg": "/caminho/bg-X.png",
  "out": "/caminho/slide-X.png",

  "title": "Frase completa pra word wrap automático",
  "title_lines": ["Linha 1", "Linha 2"],
  "title_size": 92,

  "subtitle": "subtitulo em uppercase via lower",
  "subtitle_lines": ["LINHA 1 SUBTITULO", "LINHA 2"],
  "subtitle_size": 24,
  "subtitle_tracking": 3,

  "body": "corpo de texto serif",
  "body_lines": ["Corpo linha 1.", "Corpo linha 2.", "", "Após espaço."],
  "body_size": 32,

  "y_start": 180,
  "gap_after_title": 60,

  "handle": "@HANDLE",
  "handle_size": 28,
  "handle_tracking": 6,
  "handle_y": 1180
}
```

### Campos obrigatórios

- `bg`: caminho absoluto pro fundo (qualquer aspect ratio, será cropado pra 4:5)
- `out`: caminho absoluto pra saída
- `title` OU `title_lines`: texto principal (italic serif)

### Campos opcionais

- `subtitle` ou `subtitle_lines`: subtítulo uppercase tracked (Inter)
- `body` ou `body_lines`: corpo serif regular
- `handle`: handle no rodapé (Inter uppercase tracked)
- `y_start`: posição Y onde começa o título (default 180)
- `gap_after_title`: espaço vertical depois do título (default 40)
- `*_size`: tamanho fonte de cada bloco
- `*_tracking`: letter spacing do bloco (subtitle/handle)
- `handle_y`: Y específico pro handle (default CANVAS_H - 140)

### Convenções

- Use `*_lines` (array) pra controlar quebras manualmente. Preferido pra hierarquia poética.
- Sem `*_lines`, o composer faz word wrap automático com base na largura.
- String vazia `""` em `body_lines` cria parágrafo (espaço extra).
- Subtítulo é automaticamente UPPERCASE via `.upper()` se vier de `subtitle` (sem `_lines`). Em `subtitle_lines`, vem como digitado.

## Tamanhos sugeridos por tipo de slide

| Tipo | title_size | body_size | subtitle_size |
|---|---|---|---|
| Capa com 1-2 palavras | 110 |, |, |
| Capa com 1 frase 2 linhas | 90-96 |, | 22-26 |
| Slide ensino com título 1-2 palavras | 96-110 | 30-36 |, |
| Slide ensino com título frase | 78-92 | 28-34 |, |
| Slide com corpo longo (5+ linhas) | 78-88 | 26-30 |, |
| CTA final | 76-92 | 32-36 |, |

## Exemplo: post estático único

```json
[
  {
    "bg": "/caminho/bg-exemplo.png",
    "out": "/caminho/post-exemplo.png",
    "title_lines": ["Onde Deus", "te coloca,", "Ele te sustenta."],
    "title_size": 88,
    "y_start": 380,
    "handle": "@SEUPERFIL",
    "handle_size": 28,
    "handle_tracking": 6,
    "handle_y": 1180
  }
]
```

## Exemplo: carrossel ensino

Estrutura típica de carrossel ensino (8 slides):

1. CAPA: gancho + subtítulo
2. CONTEXTO: setup da história
3-7. LIÇÕES: título curto + corpo 4-7 linhas
8. CTA: chamada + handle

Cada slide tem o mesmo padrão de paleta (creme, bege, mostarda, dark) e tipografia (Playfair Italic + Regular + Inter).

Veja exemplo completo no carrossel @seuperfil em `~/Downloads/posts-trabalho/exemplo/BRIEFING.md`.

## Cor padrão do texto

`(42, 38, 32)` aka `#2A2620`, espresso brown. Funciona em fundos creme/bege. Pra fundos escuros, alterar `DARK` no composer ou adicionar parametro `color` em cada slide (não implementado por padrão, exige patch no composer).

## Margens e canvas

- Canvas: 1080x1350 px (4:5 Instagram)
- Margem horizontal segura: 100 px (`margin_x = 100`)
- Largura máxima de texto: 880 px (`CANVAS_W - 2 * margin_x`)
- Subtítulo usa max_w mais apertado (-80 px adicionais) pra parecer "centralizado em coluna"

## Crop automático do fundo

Se `bg` não for 4:5, o composer crop centralizado:

- Mais largo que 4:5: corta laterais (mantém centro vertical)
- Mais alto que 4:5: corta topo/baixo (mantém centro horizontal)
- Resize final pra 1080x1350 com Lanczos (alta qualidade)

## Workflow recomendado

1. Define fluxo do post (1 slide ou carrossel) e copy de cada slide
2. Gera fundos limpos via `~/Tools/openai-image.py "PROMPT" "/caminho/bg-X.png" medium` (1 por slide)
3. Cria `slides-config.json` com array de slides
4. Roda `python3 ~/Tools/compose-post.py /caminho/slides-config.json`
5. Valida visualmente (Read tool ou abrir PNG)
6. Itera no JSON se precisar ajustar (sem regerar fundo)
7. Limpa pasta deixando só os slides finais + BRIEFING.md

## Edição rápida

Pra mudar texto de um slide já gerado: edita só o objeto correspondente no JSON e roda composer de novo. Fundo é reutilizado, só o texto muda. Iteração custa zero.

## Troubleshooting

### Composer não renderiza body
Verifica se `body` ou `body_lines` está no JSON. Antes do fix de 2026-04, composer pulava body se só `body_lines` estivesse presente. Composer atual aceita ambos.

### Texto sai cortado nas bordas
Aumenta `margin_x` no composer (atual 100) ou reduz `*_size`. Verifica se text_lines não excede 880 px de largura.

### Fonte não carrega
`OSError: cannot open resource`. Confere que os 3 .ttf existem em `~/Tools/fonts/`. Se faltam, baixa via Google Fonts:

```bash
mkdir -p ~/Tools/fonts && cd ~/Tools/fonts
curl -sL "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" -o PlayfairDisplay.ttf
curl -sL "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf" -o PlayfairDisplay-Italic.ttf
curl -sL "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf" -o Inter.ttf
```

### Pillow não instalado
```bash
python3 -m pip install --user Pillow
```

### Cor de texto não bate com fundo
Edita constante `DARK` em `~/Tools/compose-post.py` (linha 11). RGB tuple. Padrão `(42, 38, 32)`. Pra fundos dark, usar `(232, 221, 201)` (creme).

## Limites

O composer atual NÃO suporta:

- Cor de texto por slide (só global em `DARK`)
- Bold em palavra específica dentro de uma linha (precisa fonte bold separada)
- Aspas curvas tipográficas automáticas (passa direto o que tá no JSON, recomendo usar `"` ao escrever no JSON pra ficar tipograficamente correto)
- Drop shadow no texto (pode ser adicionado via patch)
- Itálico parcial (uma palavra italic dentro de linha regular)

Pra essas necessidades, vai pro Passo 5b: refinamento manual em Figma.

## Frase pra lembrar

Texto via código é determinístico. Se o JSON tá certo, o output tá certo. Errar acento? Impossível.
