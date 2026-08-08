# Integração com OpenAI (API + ChatGPT Plus)

A OpenAI oferece dois caminhos pra geração de imagem do post:

1. **OpenAI API** (gpt-image-1 ou DALL-E 3): automação completa, integração via código.
2. **ChatGPT Plus** (DALL-E 3 nativo): manual, sem código, ideal pra peça única especial.

Esta reference cobre os dois.

## Caminho 1: OpenAI API

### Setup da API key

1. Acesse [platform.openai.com](https://platform.openai.com).
2. Faça login com conta OpenAI.
3. Vá em "API keys" no menu lateral.
4. Click "Create new secret key".
5. Dê um nome (ex: `claude-code-design-posts`).
6. Copie a chave (começa com `sk-...`).
7. Adicione créditos no Billing (mínimo US$ 5).

### Configurar no shell

Adicione ao `~/.zshrc`:

```bash
export OPENAI_API_KEY="sk-sua-chave-aqui"
```

Recarregue:

```bash
source ~/.zshrc
```

Verifique:

```bash
echo $OPENAI_API_KEY
```

### Modelos disponíveis

| Modelo | Resolução | Custo por img | Melhor para |
|---|---|---|---|
| `gpt-image-1` (high) | 1024-1536px | ~$0.17 | Mood cinematográfico, instruction following |
| `gpt-image-1` (medium) | 1024-1536px | ~$0.07 | Uso geral |
| `gpt-image-1` (low) | 1024-1536px | ~$0.02 | Rascunho, exploração |
| `dall-e-3` (HD) | 1024-1792px | ~$0.08 | Realismo fotográfico decente |
| `dall-e-3` (standard) | 1024-1792px | ~$0.04 | Económico |

Padrão recomendado pra post Instagram: `gpt-image-1` quality `medium`.

### Aspect ratios suportados

`gpt-image-1` aceita:

- `1024x1024` (1:1 quadrado)
- `1024x1536` (2:3 portrait, próximo do 4:5 do Instagram)
- `1536x1024` (3:2 landscape)
- `auto` (modelo decide)

`dall-e-3` aceita:

- `1024x1024` (1:1)
- `1024x1792` (9:16 portrait)
- `1792x1024` (16:9 landscape)

Pra Instagram 4:5: gere em `1024x1536` (2:3) e faça crop ajustado pra 1080x1350 (4:5) no Figma. Perde 15% no topo e rodapé, mas funciona.

### Como invocar

Não existe skill nativa Claude Code pra OpenAI Image. Caminhos:

**Opção A: usar Bash via curl**

```bash
curl https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-1",
    "prompt": "[seu prompt aqui]",
    "size": "1024x1536",
    "quality": "medium",
    "n": 1
  }' | jq -r '.data[0].b64_json' | base64 -d > fundo.png
```

**Opção B: script Python local**

Salve em `~/Tools/openai-image.py`:

```python
#!/usr/bin/env python3
import os
import sys
import base64
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

prompt = sys.argv[1] if len(sys.argv) > 1 else "test"
output = sys.argv[2] if len(sys.argv) > 2 else "fundo.png"

response = client.images.generate(
    model="gpt-image-1",
    prompt=prompt,
    size="1024x1536",
    quality="medium",
    n=1,
)

img_data = base64.b64decode(response.data[0].b64_json)
with open(output, "wb") as f:
    f.write(img_data)
print(f"Salvou em {output}")
```

Instale dependência:

```bash
pip install openai
chmod +x ~/Tools/openai-image.py
```

Use:

```bash
python ~/Tools/openai-image.py "Photographic background, warm tan beige tones..." ~/Downloads/fundo.png
```

**Opção C: criar skill Claude Code customizada**

Pode ser feito como skill `43-openai-imagegen` espelhando a estrutura de `gemini-imagegen`. Não vou criar agora, mas é direto se quiser depois.

## Caminho 2: ChatGPT Plus (DALL-E 3 nativo)

Mais simples, sem código, ideal pra peças especiais que merecem atenção manual.

### Como usar

1. Abra [chatgpt.com](https://chatgpt.com) (precisa Plus US$ 20/mês).
2. Em conversa nova com GPT-4 (default), cole o prompt da skill 42.
3. Adicione no fim: "Generate this image in 2:3 vertical format."
4. ChatGPT chama DALL-E 3 e mostra a imagem.
5. Click direito > Salvar imagem.

### Custom GPT (recomendado)

Pra automatizar dentro do ChatGPT Plus:

1. Click "Explore GPTs" > "Create".
2. Nome: `Design Posts Instagram`.
3. Description: `Produz briefing e gera fundo pra post estático Instagram`.
4. Instructions: cole o conteúdo do `42-design-posts/SKILL.md` inteiro.
5. Knowledge: faça upload de cada arquivo de `42-design-posts/references/*.md` (até 20 arquivos).
6. Capabilities: ative "Image Generation" (DALL-E 3) e "Code Interpreter".
7. Save > "Only me" se for pessoal.

Depois, quando quiser produzir um post:

1. Abra seu Custom GPT.
2. Diga "Quero produzir post sobre [tema]".
3. Ele roda o quiz, monta briefing, gera imagem direto.
4. Você baixa.

Vantagem: tudo em um lugar, sem custo extra (já paga Plus).

Limitação: DALL-E 3 não é tão bom quanto gpt-image-1 ou Gemini Imagen pra fotografia realista. Resultado fica 70-80% do estilo das suas referências.

## Quando usar cada caminho

| Situação | Ferramenta recomendada |
|---|---|
| Produção batch (5+ posts numa sessão) | OpenAI API gpt-image-1 medium ou Gemini |
| Peça única especial (lançamento, manifesto) | gpt-image-1 high ou Midjourney |
| Exploração/teste de estilo novo | gpt-image-1 low ou DALL-E standard |
| Quero economizar | Gemini (free tier generoso) |
| Quero custom GPT pra equipe usar | ChatGPT Plus + Custom GPT |
| Quero integração 100% no Claude Code | Gemini (já tem skill nativa) |
| Quero melhor instruction following | OpenAI gpt-image-1 |
| Quero melhor realismo de luz natural | Gemini Nano Banana Pro |

## Combo recomendado pro seu fluxo

Como você quer ter os 3 disponíveis, eis a estratégia:

1. **Default (Gemini Nano Banana Pro)**: skill 42 invoca automaticamente. Para 90% das peças.
2. **Especial (OpenAI gpt-image-1 high)**: pra peça importante (lançamento, manifesto), use o script Python local.
3. **Manual/exploração (ChatGPT Plus)**: quando quer iterar visualmente em conversa, sem código.

## Custos comparados pra 30 posts/mês

| Stack | Custo total mês |
|---|---|
| Só Gemini (free tier ou pago) | $0 - $1.20 |
| Só OpenAI gpt-image-1 medium | $2.10 |
| Só OpenAI gpt-image-1 high | $5.10 |
| Só DALL-E 3 standard | $1.20 |
| Só ChatGPT Plus (DALL-E ilimitado) | $20 (assinatura) |
| Combo: Gemini default + OpenAI ocasional + Plus | $20-25 |

Cheaper combo sério: Gemini default + DALL-E quando precisa fallback. ~$1.50/mês.

Combo confortável: ChatGPT Plus (DALL-E ilimitado) + Gemini free tier. $20/mês fixo + flexibilidade total.

## Fallback chain (ordem de tentativa)

Se quiser robustez total, configure assim:

1. Tenta Gemini primeiro (mais barato, integrado).
2. Se Gemini falhar (quota, erro): tenta OpenAI gpt-image-1.
3. Se OpenAI falhar: alerta usuário pra usar ChatGPT Plus manual.

## Frase pra lembrar

Não existe ferramenta perfeita. Existe ferramenta certa pro contexto. Gemini ganha em custo e luz natural, OpenAI ganha em instruction following e texto, ChatGPT Plus ganha em conveniência. Use as três quando o caso pedir.
