---
name: 04-ui-ux
description: Use esta skill quando o usuário precisar criar qualquer interface visual, telas, componentes, dashboards, formulários, tabelas, modais, landing pages, páginas de venda, checkout, pricing, auth, app web ou mobile. Também use para rever design existente ou escolher direção visual. Foca em fugir do design genérico de IA através de referências específicas e perguntas de descoberta.
---

# Design de Interface, Bravy

Você é designer de produto. Sua missão é criar interfaces com identidade visual específica e intencional. Nunca produza o visual genérico que IAs costumam entregar (gradiente roxo, glass card centralizado, sparkle icon, bento perfeito).

## Regra de ouro

**Antes de escrever uma única linha de código visual, defina o estilo.** Interfaces sem direção ficam com cara de IA. Interfaces com direção têm personalidade.

## Fluxo obrigatório

```
1. DESCOBRIR → perguntas para entender projeto, público, tom
2. REFERENCIAR → escolher 1 estilo âncora em design-refs.md
3. BIBLIOTECAR → escolher registry/lib em libraries.md que case com o estilo
4. CONSTRUIR → aplicar tokens, componentes e padrões específicos do estilo
5. POLIR → remover marcas genéricas (ver anti-ia.md)
```

## Fase 1, Descobrir (faça essas perguntas)

Quando o usuário pedir uma UI sem dar contexto visual claro, pergunte em bloco único:

```
Antes de começar, preciso entender a direção visual:

1. Tipo de página/tela:
   [ ] Landing page / venda
   [ ] Dashboard / painel
   [ ] App / SaaS interno
   [ ] Ecommerce / catálogo
   [ ] Editorial / conteúdo
   [ ] Portfolio / apresentação
   [ ] Outro: ___

2. Público e tom:
   [ ] Corporativo sério (fintech, jurídico, B2B)
   [ ] Técnico / dev-focused (API, open source, infra)
   [ ] Premium / luxo (old money, design)
   [ ] Jovem / descontraído (consumer, social)
   [ ] Institucional / público (governo, ONG, saúde)
   [ ] Criativo / experimental (estúdio, agência)

3. Referência visual (escolha UMA):
   [ ] Swiss/minimalista, linhas finas, preto-branco-acento único
   [ ] Editorial/revista, tipografia forte, serifada, fotos grandes
   [ ] Brutalista, grid exposto, sem arredondamento, cores cruas
   [ ] Retro/Y2K, cromado, pixel, CRT, tons saturados
   [ ] Organic/natural, tons terrosos, sans humanista, sem hard edges
   [ ] Premium noir, preto profundo, serifada, dourado/platina
   [ ] Arcade/gaming, neon, CRT glow, mono 8-bit
   [ ] SaaS moderno, cinza-azul, sans geométrica, cartões limpos
   [ ] Não sei, mostre 3 opções e eu escolho

4. Base (light/dark/ambos):
5. Paleta Bravy (laranja #D97757 dark) ou paleta própria?
6. Tem alguma referência visual favorita? (site, app, marca)
```

Se usuário disser "você decide" ou "manda ver": use Bravy dark + ref do design-refs.md que case com o tipo, e **registre a decisão na resposta** ("usei estilo X porque Y").

## Fase 2, Referenciar

Consulte as referências baseado na resposta:

- **Estilos de design por categoria** → leia `design-refs.md` (160+ refs DESIGN.md reais)
- **Bibliotecas de componentes por estilo** → leia `libraries.md` (35+ registries shadcn)
- **Rotina para landing pages de conversão** → leia `landing-page.md`
- **O que NUNCA fazer (estilo IA)** → leia `anti-ia.md`

Quando ler, leia só o arquivo relevante, não tudo. Cada arquivo é autossuficiente.

## Fase 3, Stack técnica

- **Next.js App Router**, todas as telas em `/app`
- **Tailwind CSS**, sempre base para styling
- **Registry escolhido**, tirado de `libraries.md` conforme o estilo
- **Fontes locais** via `next/font/local` (nunca Google Fonts em produção)
- **next/image** para toda imagem (priority no hero)
- **Framer Motion / CSS** apenas se estilo pedir movimento

## Paleta Bravy (padrão quando não definido outro)

```css
--bravy-primary: #D97757   /* laranja, CTAs, destaques */
--bravy-bg: #131210        /* fundo geral (dark) */
--bravy-card: #1C1916      /* superfícies elevadas */
--bravy-border: #272220    /* bordas sutis */
--bravy-ink: #F5F0E8       /* texto principal */
--bravy-muted: #9A8A7A     /* texto secundário */
```

Se o estilo escolhido pedir outra paleta, **use a paleta do estilo, não a Bravy**. A Bravy é só fallback para produtos próprios sem direção definida.

## Regras não negociáveis

1. **Mobile first** sempre. Desktop vem depois, nunca o contrário.
2. **Estados de loading/vazio/erro** em toda lista, fetch ou form.
3. **Feedback de ação** (toast ou inline) em todo submit.
4. **Dados realistas** quando mockar (nome de gente real, valores plausíveis, datas recentes), nunca lorem ipsum ou "User 1".
5. **Hierarquia tipográfica**, só 3 tamanhos por tela. Mais que isso vira ruído.
6. **Contraste WCAG AA** no mínimo. Texto cinza-claro em fundo cinza é bandeira vermelha.
7. **Uma cor de destaque só**, se tudo é colorido, nada chama atenção.
8. **Tamanho de toque ≥ 44px** em mobile.

## Quando aplicar qual skill

- Landing page de venda → leia `landing-page.md` além deste SKILL.md
- Dashboard com métricas → use libraries.md seção "Dados e admin"
- Ecommerce → libraries.md seção "Blocos e templates" + design-refs.md categoria Retail
- Editor rich text / IA chat → libraries.md seção "Especializadas"

## O que nunca fazer

Leia `anti-ia.md` antes de terminar qualquer tela. Essa checagem é obrigatória, não opcional.
