# Workflow operacional de execução

Pipeline IA + código pra produzir post estático ou carrossel Instagram. Tempo estimado: 10 a 20 min por peça depois da stack montada.

## Stack mínima

- `OPENAI_API_KEY` no shell (`echo $OPENAI_API_KEY` deve retornar `sk-proj-...`).
- `~/Tools/openai-image.py` (gera fundo via gpt-image-1).
- `~/Tools/compose-post.py` (aplica texto via Pillow).
- `~/Tools/fonts/` com Playfair Display Italic + Regular + Inter (.ttf).
- Pillow instalado (`python3 -c "from PIL import Image"`).
- Pasta organizada local: `~/Downloads/posts-trabalho/[tema-curto]/`.

Setup uma vez:

```bash
mkdir -p ~/Tools/fonts && cd ~/Tools/fonts
curl -sL "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" -o PlayfairDisplay.ttf
curl -sL "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf" -o PlayfairDisplay-Italic.ttf
curl -sL "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf" -o Inter.ttf
python3 -m pip install --user Pillow openai
```

## Fase 1: input do quiz (5 min)

Roda quiz de 5 perguntas (formato exato em `SKILL.md`):

1. Texto principal.
2. Intenção (acolhimento, convicção, ensino, manifesto, anúncio).
3. Mood visual (bege, mostarda, dark, creme, surpreender).
4. Elemento de fundo (planta, mão, janela, objeto, trama).
5. Handle.
6. (Opcional) Palavras em bold.

Pra carrossel, define quantos slides (6-10 típicos) e a estrutura: capa + lições + CTA.

## Fase 2: gerar briefing (5 min)

Com base nas respostas do quiz, monte um BRIEFING.md na pasta do post. Inclui:

- Tema e intenção
- Paleta escolhida (com hex)
- Tipografia (Playfair Italic + Regular + Inter padrão)
- Texto de cada slide (título, corpo, subtítulo, handle)
- Lista de prompts pros fundos (1 por slide)

## Fase 3: gerar fundos limpos (5-10 min, paralelo)

Pra cada slide, monta prompt seguindo template:

```
Vertical 4:5 portrait Instagram post background, no text, no people, no faces.
Photographic background with [PALETA E TONS], [LUZ E DIREÇÃO],
[ELEMENTO DE FUNDO da resposta do quiz] in [POSIÇÃO],
generous empty space in upper two thirds for text overlay,
ultra minimal composition, Kodak Portra 400 film aesthetic,
slightly grainy.
```

**Crítico:** sempre incluir `no text, no people, no faces`. Texto será aplicado depois via composer.

Roda em paralelo respeitando rate limit OpenAI (5 imagens/min):

```bash
source ~/.zshrc && python3 ~/Tools/openai-image.py "PROMPT_DO_SLIDE_1" \
  ~/Downloads/posts-trabalho/TEMA/bg-1.png medium &

source ~/.zshrc && python3 ~/Tools/openai-image.py "PROMPT_DO_SLIDE_2" \
  ~/Downloads/posts-trabalho/TEMA/bg-2.png medium &

# ... até 5 em paralelo, depois espera 60s pro próximo batch
```

Custo: $0.07 por slide (medium quality). Carrossel de 8 slides ≈ $0.56.

## Fase 4: criar slides-config.json (5 min)

Monta JSON com array de slides. Cada objeto define o que vai sobre o fundo. Estrutura completa em `composer-pillow.md`. Exemplo enxuto:

```json
[
  {
    "bg": "/caminho/bg-1.png",
    "out": "/caminho/slide-1.png",
    "title_lines": ["Título principal", "em duas linhas"],
    "title_size": 92,
    "subtitle_lines": ["SUBTITULO UPPERCASE"],
    "subtitle_size": 24,
    "subtitle_tracking": 3,
    "y_start": 200,
    "gap_after_title": 60
  },
  {
    "bg": "/caminho/bg-2.png",
    "out": "/caminho/slide-2.png",
    "title_lines": ["Título do slide 2"],
    "title_size": 96,
    "body_lines": [
      "Corpo linha 1.",
      "Corpo linha 2.",
      "",
      "Linha após espaço."
    ],
    "body_size": 32,
    "y_start": 180,
    "gap_after_title": 60
  }
]
```

## Fase 5: rodar composer (1 min)

```bash
python3 ~/Tools/compose-post.py /caminho/slides-config.json
```

Output: PNGs 1080x1350 sRGB nos paths definidos em `out`. Pronto pra postar.

## Fase 6: validar (3-5 min)

1. Abre cada PNG (Read tool ou Finder/Preview).
2. Confere texto: acentos corretos, sem palavras juntando.
3. Confere hierarquia visual: título legível, body respira, handle discreto.
4. Roda checklist em `references/checklist-qualidade.md`.

Se algum slide precisa ajuste de texto ou tamanho, edita só ele no `slides-config.json` e roda composer de novo. Iteração custa zero (sem regerar fundo).

Se fundo precisa mudar (composição não funciona), regera só esse `bg-N.png` via openai-image.py e roda composer.

## Fase 7: arquivar e postar (5 min)

1. Limpa pasta deixando só `slide-*.png` finais + `BRIEFING.md` (apaga `bg-*.png` e `slides-config.json` se quiser, mas perde possibilidade de reedição).
2. Move pra `~/Drive/PostsInstagram/AAAA-MM/` ou pasta de arquivamento.
3. Renomeia se quiser: `[YYYY-MM-DD]-[tema]-slide-N.png`.
4. Posta no Instagram (celular, Meta Business, Later, Buffer).
5. Anota no Notion ou planilha.

## Tempo total por peça

- Fase 1: 5 min (quiz)
- Fase 2: 5 min (briefing)
- Fase 3: 5-10 min (fundos paralelos, depende de rate limit)
- Fase 4: 5 min (config JSON)
- Fase 5: 1 min (composer)
- Fase 6: 3-5 min (validar)
- Fase 7: 5 min (arquivar e postar)

**Total post único: 25-35 min.**
**Total carrossel 8 slides: 30-45 min** (paralelismo dos fundos compensa).

## Atalhos pra produção em lote

Pra produzir 5+ posts numa sessão:

1. Reserva 1-2h.
2. Faz quiz dos 5 textos antes (em batch).
3. Gera os 5 briefings juntos.
4. Gera os fundos em paralelo (respeitando 5/min OpenAI).
5. Monta `slides-config.json` com TODOS os slides de TODOS os posts juntos (composer roda 1x).
6. Valida todos.
7. Agenda no Meta Business ou Buffer.

Carrossel de 7 dias = 7 posts × ~25 min cada se feitos juntos = ~3h total.

## Variações úteis

### Versão "premium" (45-60 min)

- Usar gpt-image-1 quality `high` em vez de `medium` ($0.17/img). Pra capa de carrossel especial, lançamento, manifesto.
- Refinar manualmente em Figma após composer (Passo 5b da skill).

### Versão "rápida" (15 min)

- Pular fundo IA, usar foto própria ou Unsplash curado já na paleta terrosa.
- Roda composer direto sobre a foto.

## Erros comuns

1. **Esquecer `no text` no prompt**: IA inventa texto que polui o fundo. Verifica prompt antes de gerar.
2. **Rate limit OpenAI 429**: 5 imagens/min máximo. Se passar, espera 60s.
3. **Fonte não carrega**: confirma `~/Tools/fonts/*.ttf` existem.
4. **Texto cortado nas bordas**: reduz `*_size` ou ajusta `*_lines` pra quebrar antes.
5. **Acento errado no JSON**: o JSON aceita UTF-8. Use `não`, não `nao`. Editor: VS Code, nano, vim ok.
6. **Fundo gera sem espaço pro texto**: prompt precisa de `generous empty space in upper two thirds`. Regera com prompt mais explícito.

## Frase pra lembrar

Workflow profissional não é o mais bonito. É o que entrega texto perfeito sem retrabalho. Fundo IA + texto código = zero acento errado, custo previsível, iteração instantânea.
