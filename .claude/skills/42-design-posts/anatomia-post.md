# Anatomia do post estático

Estrutura técnica de cada peça de 1080x1350px (formato 4:5 do Instagram feed). Use como template mental antes de abrir Figma/Canva.

## Canvas e zonas

```
┌─────────────────────────────────────┐  ← Y = 0px
│  ZONA SEGURA SUPERIOR (8% topo)     │
│  108px de altura, evita corte       │
├─────────────────────────────────────┤  ← Y = 108px
│                                     │
│  ÁREA DE RESPIRO SUPERIOR           │
│  Sombra/foto domina                 │
│  Onde NÃO entra texto principal     │
│                                     │
├─────────────────────────────────────┤  ← Y = 540px (40% altura)
│                                     │
│  BLOCO DE TEXTO PRINCIPAL           │
│  Centro óptico da peça              │
│  35% da altura (472px)              │
│                                     │
├─────────────────────────────────────┤  ← Y = 1012px (75% altura)
│                                     │
│  ÁREA DE RESPIRO INFERIOR           │
│  Sombra/foto domina                 │
│  Handle (se não estiver no topo)    │
│                                     │
├─────────────────────────────────────┤  ← Y = 1242px
│  ZONA SEGURA INFERIOR (8% rodapé)   │
│  108px de altura                    │
└─────────────────────────────────────┘  ← Y = 1350px
```

Largura útil: 908px (canvas 1080 - 86px de cada lado).

## Os 4 níveis de hierarquia

Toda peça tem no máximo 4 níveis. Mais que isso, leitor se perde.

### Nível 1: Título principal

- Tamanho: 32-56pt (depende da extensão).
- Peso: bold ou regular (depende do combo de tipografia).
- Linhas: 1 a 4 máximo.
- Função: para o scroll. Tem que entregar a mensagem em 1.5 segundos.

### Nível 2: Texto de apoio

- Tamanho: 18-22pt.
- Peso: regular ou medium.
- Linhas: 2 a 6 máximo.
- Função: aprofundar a ideia do título sem repetir.
- Opcional: peças simples não precisam.

### Nível 3: Citação/fonte

- Tamanho: 14-16pt.
- Peso: medium.
- Função: dar autoridade (versículo, autor, fonte).
- Posicionamento: logo abaixo do bloco principal, centralizado.
- Opcional: só usa se faz sentido.

### Nível 4: Handle

- Tamanho: 12-14pt (24-28px no canvas 1080x1350).
- Peso: medium.
- Cor: 80% opacidade do branco cremoso.
- Posição: topo OU rodapé central. Nunca ambos.
- Sempre presente.

## Centro óptico

Olho humano lê primeiro o centro vertical, depois 1/3 superior, depois 1/3 inferior. Use isso a favor.

Centro óptico real: Y = ~600px (44% da altura, ligeiramente acima do centro geométrico).

Posicione o título principal nessa região. Não no centro matemático (Y = 675px), porque visualmente parece "afundado".

## Margem e respiro

Margens externas (deixar a peça respirar):

- Cada lado: 86px (8% da largura).
- Topo zona segura: 108px.
- Rodapé zona segura: 108px.

Respiro entre blocos de texto:

- Entre título e apoio: 24-32px.
- Entre apoio e citação/fonte: 16-24px.
- Entre handle e bordas: mínimo 64px.

Respiro de elementos visuais ao texto:

- Sombra ou objeto a no mínimo 80px do bloco de texto.
- Se sombra atravessar texto, escurecer área (overlay de 15-25%).

## Linhas e leading (line height)

Para texto de 1 linha, line height não importa.

Para 2+ linhas:

- Título grande (40-56pt): line height 1.1 a 1.2.
- Título médio (24-32pt): line height 1.2 a 1.3.
- Texto de apoio: line height 1.3 a 1.4.
- Citação: line height 1.3.

## Quebras de linha intencionais

Não deixar quebra automática decidir. Quebrar manualmente para:

1. Manter palavra-chave junto da próxima palavra.
2. Equilibrar comprimento de linhas (linhas similares = mais elegante).
3. Evitar "viúvas" (palavra solta na última linha).

Exemplo ruim:

```
Você não perde lugares quando cresce em
Deus.
```

Exemplo bom:

```
Você não perde lugares quando
cresce em Deus.
```

## Bold seletivo

Regras pra escolher palavras em bold:

- Verbo de ação central: "perde", "transforma", "decide".
- Substantivo abstrato emocional: "sonho", "promessa", "valor", "coragem".
- Conceito-chave: "Deus", "validação", "processo", "alinhado".

Quantidade ideal: 2 a 4 palavras em bold por peça.

Quando bold cai mal:

- Em conjunção, artigo, preposição.
- Em mais de 50% das palavras (perde efeito).
- Espalhado aleatoriamente sem padrão semântico.

## Posicionamento do handle

Topo central:

- Y = 80px (centro do handle).
- Bom quando: o texto principal está na metade inferior.
- Bom quando: a peça começa com sombra/foto vazia no topo.

Rodapé central:

- Y = 1240-1280px.
- Bom quando: o texto principal está no centro/topo.
- Bom quando: a peça tem objeto/elemento no rodapé.

Decisão prática: olha onde tem ÁREA VAZIA. Coloca o handle na área vazia mais discreta.

## Variações de composição (3 padrões)

### Padrão A: Texto centralizado puro

- 1 bloco de texto no centro óptico.
- Sombras/foto domina respiro superior e inferior.
- Handle no topo OU rodapé.
- Mais comum (5 das 9 referências).

### Padrão B: Texto no terço inferior

- Bloco de texto começa em Y = 60% (810px) e desce.
- Topo respira com sombra dramática.
- Handle no topo central.
- 3 das 9 referências.

### Padrão C: Texto no terço superior

- Bloco de texto começa em Y = 25% (340px) e desce.
- Rodapé respira com sombra ou objeto.
- Handle no rodapé central.
- 1 das 9 referências.

## Quando usar caixa de destaque

A peça pode ter UMA caixa de destaque, não mais:

- Caixa de bordas finas em volta de frase-âncora ("Você já foi escolhida").
- Caixa de fundo preenchido (cor terrosa) em palavra-chave dentro da frase.
- Hierarquia visual: caixa fica em Nível 2 (subordinada ao título).

Em referência analisada: peça do espelho usa caixa em "Você já foi escolhida". Funciona porque é uma frase-resumo.

## Testes finais antes de exportar

3 testes de leitura:

1. Squint test: aperta os olhos. A hierarquia continua clara?
2. Thumb test: passa o polegar sobre o texto principal por 1.5s. Conseguiu ler?
3. Context test: imagina rolando feed. A peça para o scroll?

Se 2 dos 3 falham, refazer.

## Frase pra lembrar

Anatomia clara é peça invisível. Quando o leitor lê sem perceber estrutura, a estrutura está perfeita. Quando trava, é porque você quebrou uma das regras acima.
