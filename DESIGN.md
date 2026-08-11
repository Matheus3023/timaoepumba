# DESIGN.md — Timão e Pumba Tips

Âncora visual: **Sports HUD** — a linguagem de uma transmissão esportiva ao vivo.
Escolhida porque o produto é tempo real (placar ao vivo, sinal de escanteio com
janela de minutos) e porque posiciona a marca como *analista*, não como
palpiteiro. Quem confia, deposita.

Regra única: **nada aqui é decorativo.** Se um pixel não carrega dado, contexto
ou ação, ele sai.

---

## 1. Cor

Preto de painel de controle, não preto de "dark mode genérico". A base puxa
**verde**, não azul: é gramado visto no escuro, não console de nave. Foi uma
correção deliberada — a primeira versão veio azulada e ficou com cara de
dashboard de infra qualquer, sem dizer nada sobre futebol.

```css
--hud-void:      #050B07;  /* fundo da página */
--hud-deck:      #0A1410;  /* superfície: card, painel */
--hud-deck-2:    #112019;  /* superfície elevada: linha ativa, hover */
--hud-rule:      #1D3227;  /* borda 1px, divisória */
--hud-rule-soft: #142219;  /* divisória interna, mais discreta */
```

Texto em escala de 4 níveis, com a mesma temperatura verde para não brigar com
o fundo. Mais que isso vira ruído.

```css
--hud-ink:       #F2F7F4;  /* título, número que importa */
--hud-body:      #B9C9BF;  /* corpo */
--hud-dim:       #7B9086;  /* rótulo, metadado */
--hud-faint:     #4B5C53;  /* desabilitado, placeholder */
```

Acento único: **amarelo de transmissão**. Não é o `yellow-400` do Tailwind
(`#facc15`) — aquele é o amarelo que toda IA cospe. Este é mais saturado e
levemente mais quente, com peso de faixa de sinalização.

```css
--hud-live:      #FFD100;  /* AÇÃO: CTA, valor em destaque, estado ativo */
--hud-live-deep: #E5BC00;  /* hover/pressed */
--hud-live-haze: rgba(255, 209, 0, 0.10);  /* fundo de badge/realce */
```

Sinais de estado. **Só aparecem quando há estado real** — nunca como enfeite.

```css
--hud-on:    #17C46A;  /* verde da marca: sinal confirmado, green, ativo */
--hud-off:   #FF3B2F;  /* vermelho: AO VIVO pulsando, red, erro */
--hud-wait:  #FF9F0A;  /* âmbar: pendente, aguardando resolução */
```

**Uso do amarelo:** só em ação e em número que decide. Se a tela tem 5 coisas
amarelas, 4 estão erradas. O vermelho é reservado para "ao vivo" e para perda —
nunca para botão de destaque.

## 2. Tipografia

Três famílias com papéis rígidos. Todas **self-hosted** em `src/fonts/`
(`next/font/local`). Nunca Google Fonts CDN.

| Papel | Família | Uso |
|---|---|---|
| Display | **Barlow Condensed** 700 / 500 | Título, placar, rótulo de HUD. Sempre `uppercase` com `letter-spacing` aberto nos rótulos. |
| Corpo | **Barlow** 400 / 600 | Texto corrido, descrição, formulário. |
| Dado | **JetBrains Mono** 500 / 700 | Todo número: minuto, odd, placar, CPM, percentual. `font-variant-numeric: tabular-nums` obrigatório. |

O condensado é o que dá cara de transmissão — cabe mais informação na mesma
largura, que é exatamente o problema de um painel esportivo.

**Escala.** Máximo 3 tamanhos por tela.

```
display-xl   clamp(2.75rem, 7vw, 5rem)    Barlow Condensed 700, tracking -0.02em, uppercase
display-lg   clamp(2rem, 4.5vw, 3rem)     Barlow Condensed 700, tracking -0.01em, uppercase
display-md   1.5rem                        Barlow Condensed 700, uppercase
label        0.6875rem                     Barlow Condensed 500, tracking 0.14em, uppercase
body         1rem / 1.6                    Barlow 400
body-sm      0.875rem / 1.55               Barlow 400
data-xl      2.5rem                        JetBrains Mono 700, tabular
data         1rem                          JetBrains Mono 500, tabular
```

## 3. Forma e espaço

**Raio zero.** Painel de transmissão não tem canto arredondado. Exceções: o
ponto de "ao vivo" (círculo) e o avatar (círculo). Mais nada.

```css
--hud-radius: 0px;
--hud-radius-pill: 999px;  /* só dot e avatar */
```

**Sem sombra.** Elevação se resolve com borda 1px (`--hud-rule`) e mudança de
superfície. `box-shadow` está proibido — sombra suave é assinatura de IA.

**Ritmo de espaço** em múltiplos de 4, alternando blocos apertados (dados) e
espaçosos (respiro). Nunca `py-24` em toda seção.

```
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96
```

## 4. Padrões de componente

**Régua de rótulo (label rule).** Rótulo em condensado maiúsculo com tracking
aberto, precedido de um traço de 24px na cor de acento. É a assinatura da marca
— aparece em toda abertura de seção.

```
──── ANÁLISE AO VIVO
```

**Linha de placar.** Time à esquerda, escudo 20px, placar em mono tabular à
direita, alinhado à direita para os dígitos baterem entre linhas. Minuto no
canto superior direito com o dot vermelho pulsando.

**Card de sinal.** Borda 1px, sem raio, faixa de 3px na cor do estado na borda
esquerda. Cabeçalho com a estratégia em condensado; corpo com a grade de
métricas em mono, separadas por divisória vertical de 1px.

**Grade de métrica.** Rótulo minúsculo em cima (`label`), valor em mono embaixo
(`data`). Nunca o contrário — em transmissão o olho busca o número.

**Botão.** Retângulo, fundo `--hud-live`, texto `--hud-void` em condensado
maiúsculo com tracking. Altura mínima 48px (toque ≥44px). Sem sombra, sem raio.
Secundário: borda 1px `--hud-rule`, fundo transparente.

## 5. Estados obrigatórios

Toda lista, fetch e formulário precisa de: **carregando** (esqueleto com as
mesmas dimensões do conteúdo real, nunca spinner centralizado), **vazio** (texto
que explica o porquê e oferece a próxima ação) e **erro** (o que houve + como
tentar de novo). Todo submit dá retorno visível.

## 6. Dado é conteúdo

Número sempre em mono tabular. Odd com 2 casas (`1.85`), percentual inteiro
(`64%`), minuto com apóstrofo (`88'`), CPM com 1 casa (`1.4`). Consistência de
formato é o que faz parecer ferramenta de análise em vez de blog.

## 7. Checagem anti-IA (rodar antes de entregar qualquer tela)

- [ ] Sem gradiente roxo/azul/rosa
- [ ] Sem glassmorphism
- [ ] Sem bento grid simétrico
- [ ] Sem ✨ ou ⚡
- [ ] Sem Inter/Geist
- [ ] Sem `rounded-xl shadow-lg border` genérico
- [ ] Sem hero centralizado com 2 botões
- [ ] Sem avatar stack "+10k users"
- [ ] Padding vertical **não** é igual em toda seção
- [ ] Amarelo aparece em ≤2 elementos por dobra

Dois "não" quebrados = refazer.
