# Integração automática com gemini-imagegen

A skill `compound-engineering:gemini-imagegen` (Nano Banana Pro) gera o fundo automaticamente sem você precisar copiar prompt pra outro lugar. Esta reference cobre setup, invocação, parâmetros e ajustes.

## Pré-requisito: API Key

A skill requer variável de ambiente `GEMINI_API_KEY`.

### Como obter

1. Acesse [aistudio.google.com](https://aistudio.google.com).
2. Faça login com conta Google.
3. No menu lateral, clique em "Get API key".
4. Crie uma nova chave (free tier disponível, com limite generoso).
5. Copie a chave.

### Como configurar no shell

Adicione ao seu `~/.zshrc` ou `~/.bashrc`:

```bash
export GEMINI_API_KEY="sua-chave-aqui"
```

Recarregue o shell:

```bash
source ~/.zshrc
```

Verifique:

```bash
echo $GEMINI_API_KEY
```

Se imprimir a chave, está configurado.

### Custo

- Free tier: limite generoso pra uso pessoal.
- Pago: aproximadamente US$ 0.04 por imagem gerada em 2K.
- Para 30 posts/mês em 2K: US$ 1.20.

## Como invocar pela skill 42-design-posts

Quando estiver no fluxo da skill 42 e chegar no Passo 4, Claude deve:

1. Montar o prompt completo seguindo `references/prompts-ia-imagem.md` (estrutura base + preset + elemento).
2. Invocar `compound-engineering:gemini-imagegen` com os parâmetros abaixo.
3. Salvar o arquivo retornado.
4. Avaliar o resultado e regenerar se necessário.

## Parâmetros recomendados

```python
modelo: gemini-3-pro-image-preview
aspect_ratio: 4:5
image_size: 2K
response_modalities: ['TEXT', 'IMAGE']
```

Tradução pra prompt da skill gemini-imagegen:

```
Generate image with these specs:
- Aspect ratio: 4:5 (Instagram feed vertical)
- Resolution: 2K (high quality, balanced cost/speed)
- Model: gemini-3-pro-image-preview (Nano Banana Pro, default)

Prompt: [aqui vai o prompt completo do passo 4]

Save to: ~/Downloads/posts-trabalho/[YYYY-MM-DD]/fundos/[tema-curto]-v1.png
```

## Por que 2K e não 1K ou 4K

- 1K (1024px lado maior): muito baixa pra Instagram que precisa 1080x1350. Vai pixelizar.
- 2K (2048px lado maior): suficiente. Você redimensiona pra 1080x1350 sem perda.
- 4K: overkill, mais caro, demora mais. Use só pra peças muito importantes (lançamento).

## Por que 4:5 e não outro

Instagram feed em formato vertical é exatamente 4:5 (1080x1350). Gerar em 4:5 evita distorção ou crop indesejado.

Se for pra Stories: use 9:16. Se pra carrossel quadrado: use 1:1. Mas a skill 42 foca em feed 4:5.

## Fluxo completo automatizado

```
[Você] "Quero post sobre [tema]"
  ↓
[Skill 42] roda quiz de 5 perguntas
  ↓
[Você] responde
  ↓
[Skill 42] monta briefing + prompt
  ↓
[Skill 42] invoca gemini-imagegen com prompt + 4:5 + 2K
  ↓
[gemini-imagegen] gera imagem via Nano Banana Pro
  ↓
[Skill 42] salva PNG em ~/Downloads/posts-trabalho/[data]/fundos/
  ↓
[Você] avalia. Se ruim, pede regenerar (1-2 ajustes resolvem).
  ↓
[Você] abre Figma/Canva, importa fundo, aplica texto seguindo specs.
  ↓
[Você] exporta PNG final 1080x1350.
```

Tempo total: ~10 min até ter o fundo. ~20 min mais pra texto. Total ~30 min por peça.

## Critérios de avaliação do resultado

Antes de aceitar a imagem gerada, verifique:

- [ ] Espaço pro texto está onde o briefing pediu (geralmente metade superior ou centro).
- [ ] Sombra dramática mas não invasiva (não toma o frame inteiro).
- [ ] Paleta terrosa correta (sem saturar pra laranja vivo ou amarelo neon).
- [ ] Sem rosto humano identificável (silhuetas e mãos ok).
- [ ] Sem texto inventado pela IA no fundo.
- [ ] Sem mãos disformes (problema clássico de IA).
- [ ] Objeto físico do briefing aparece (cadeira, planta, mão, espelho etc).
- [ ] Sensação fotográfica analógica (não plástica/digital).

Se 2+ falham, regenere com prompt ajustado.

## Ajustes comuns no prompt quando falha

### Se rosto humano apareceu

Adicione no fim:

```
no people, no faces, no humans visible, only silhouette shadows allowed
```

### Se texto inventado apareceu

Adicione:

```
completely empty wall surface, no text, no letters, no writing, no signs of any kind
```

### Se cor saiu saturada demais

Adicione:

```
muted desaturated tones, low saturation, vintage Kodak Portra 400 color grading,
analog film aesthetic
```

### Se composição saiu cheia (sem espaço pro texto)

Adicione/reforce:

```
generous empty negative space in [position], minimalist composition, only the
shadow as visual element, the rest is empty wall surface
```

### Se realismo baixo (parece ilustração)

Adicione:

```
photorealistic, real photograph, DSLR camera, 50mm lens, shallow depth of field,
cinematic film grain
```

## Comparação com outras ferramentas

| Ferramenta | Custo/img | Qualidade fotográfica | Controle | Integração com skill 42 |
|---|---|---|---|---|
| Nano Banana Pro (gemini-imagegen) | ~$0.04 | Excelente | Bom (4:5 nativo) | Automática, integrada |
| Midjourney v6+ | ~$0.10 | Excepcional | Excelente | Manual, copia/cola |
| Flux 1.1 Pro | ~$0.05 | Excelente | Bom | Manual via Replicate |
| DALL-E 3 (ChatGPT) | grátis (Plus) | Boa | Limitado | Manual |
| Imagen 3 (Google) | similar Nano Banana | Excelente | Bom | Possível via API |

Recomendação: comece com Nano Banana Pro (já integrado, qualidade alta, custo baixo). Se resultado não satisfizer pra peça importante, refaz manualmente em Midjourney.

## Troubleshooting

### Erro: "GEMINI_API_KEY not set"

A variável não está exportada no shell. Reabra o terminal depois de adicionar ao `.zshrc`. Se ainda erro, verifique:

```bash
echo $GEMINI_API_KEY
```

### Erro: "Quota exceeded"

Atingiu limite do free tier. Espere 24h ou ative billing no Google AI Studio.

### Erro: "Image not generated"

Prompt provavelmente foi bloqueado por safety filters. Reescreva sem palavras gatilho. Geralmente acontece com palavras tipo "nude", "violent", "explicit" mesmo em contexto inofensivo.

### Imagem veio em 1:1 ao invés de 4:5

Verifique se o aspect_ratio foi passado corretamente. A skill `gemini-imagegen` aceita o parâmetro mas precisa ser explícito.

### Imagem demora muito

2K demora 8-15s normalmente. 4K demora 15-30s. Se passar disso, instabilidade da API. Tente novamente.

## Backup pra quando Gemini não está disponível

Se Gemini estiver fora do ar, fluxo de fallback:

1. Copie o prompt gerado pela skill 42.
2. Cole em Midjourney v6+ (Discord) com `--ar 4:5 --style raw --v 6.1`.
3. Ou cole em Flux 1.1 Pro via Replicate ou fal.ai.
4. Baixe a imagem e siga o resto do fluxo da skill 42.

## Frase pra lembrar

Integração não é magia, é encanamento bem feito. Configure a API key uma vez, deixa a skill rodar. Você ganha 5-10 min por peça e nunca mais precisa abrir Midjourney pra fundo padrão. Pra peça especial, ainda dá pra ir manual.
