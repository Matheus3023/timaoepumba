# Landing Pages de Alta Conversão

Use este arquivo em conjunto com o SKILL.md quando o projeto for especificamente uma landing page de venda, captura ou lançamento.

## Antes de começar, garanta

- Estilo visual definido em `design-refs.md` (landing vaga = landing genérica)
- Registry escolhido em `libraries.md` (Tailark costuma ser o melhor match)
- Checklist de `anti-ia.md` em mente (landing é onde o "cara de IA" mais aparece)

## Estrutura obrigatória (ordem importa)

```
1. Hero          → proposta de valor + CTA principal
2. Prova social  → quem já usa / resultados reais
3. Benefícios    → o que o usuário ganha (não features)
4. Como funciona → processo simples em 3 passos
5. Para quem é   → qualificação de lead
6. Objeções/FAQ  → quebra de objeções
7. CTA final     → urgência + garantia
```

Seções extras opcionais (use com parcimônia): Depoimentos em vídeo, Stack/integrações (logos), Comparativo vs concorrente, Bônus, Garantia expandida, Sobre o fundador.

## Hero, os primeiros 3 segundos

O hero deve responder, sem rolagem, a 3 perguntas:

1. **O que é?** (1 linha)
2. **Para quem é?** (subtexto)
3. **Por que agora?** (âncora de valor/prazo)

### Template

```tsx
<section className="...">
  <h1>Verbo + Resultado + Prazo/Mecanismo</h1>
  {/* Ex: "Construa seu CRM em um fim de semana" */}

  <p>Subheadline com mecanismo único + para quem</p>
  {/* Ex: "Plataforma BaaS com 8 ferramentas integradas,
       sem precisar montar stack toda vez." */}

  <div className="flex gap-3">
    <button className="primary">CTA específico →</button>
    {/* "Quero começar agora" > "Saiba mais" */}
    <button className="ghost">Ver demonstração</button>
  </div>

  <p className="text-sm text-muted">
    R$ 97/mês · 7 dias de garantia · Cancelamento a qualquer momento
  </p>
</section>
```

### Anti-padrões no hero (re-lembrando)

- Eyebrow badge com "New ✨"
- Gradient roxo por baixo do h1
- Mockup 3D flutuante gerado por IA
- "Welcome to ..." ou "Introducing..."

## Princípios de conversão

### 1. Clareza > Criatividade

Headline diz **exatamente** o que o produto faz. "Reimagine CRM" é ruim. "Seu CRM em um fim de semana" é bom.

CTA diz o que acontece ao clicar:
- Bom: "Quero começar agora", "Ver planos", "Criar minha conta"
- Ruim: "Saiba mais", "Clique aqui", "Próximo"

### 2. Prova social específica

Números concretos ganham de adjetivos.

- Bom: "Bravy construiu 6 sistemas internos em 4 meses"
- Ruim: "Milhares de empresas confiam em nós"

Formato de prova que converte:
1. **Logos de clientes** reconhecíveis (use SVGL)
2. **Depoimento com foto, nome, cargo e empresa** (não anônimo)
3. **Case study com número** (aumento de X%, redução de Y%, antes/depois)
4. **Contagem ao vivo** ("3.247 ativos agora") quando verdadeiro

### 3. Urgência real (nunca falsa)

- Prazo real de oferta com data visível
- Vagas limitadas com número que diminui de verdade
- Preço de lançamento com data de aumento

**Urgência falsa destrói confiança.** Nada de "só hoje" que fica no ar há 3 meses.

### 4. Garantia remove risco

- "7 dias de garantia, se não gostar, devolvemos tudo, sem perguntas."
- "Cancele a qualquer momento, sem multa."
- "Setup em 1 call de 30min ou sua próxima mensalidade é grátis."

### 5. Um único CTA primário

Ao longo da página, apareça 3+ vezes o mesmo CTA principal (hero, meio, final). Não misture "Comprar agora" com "Falar com vendedor" no mesmo CTA primário.

## Formulário mínimo

Quanto menos campos, maior a conversão. Ordem de prioridade:

1. **Email** (sempre)
2. **Nome** (se precisar personalizar)
3. **Telefone** (só se for vender alto ticket e precisar ligar)
4. Nada mais.

Tudo que não for essencial, peça depois do cadastro, dentro do produto.

## Stack técnica

- **Next.js App Router**, sempre
- **Tailwind CSS**, base
- **Tailark** (libraries.md §3), blocos de landing prontos
- **Origin UI** para formulários
- **Animações com CSS** ou **Motion** pontual (sem lib pesada)
- **next/image** com `priority` no hero
- **next/font/local** para fontes (nunca Google Fonts em prod)

## Performance (obrigatório)

```tsx
import Image from 'next/image'
import localFont from 'next/font/local'

// Hero image com priority
<Image src="/hero.webp" alt="..." priority width={1200} height={800} />

// Fontes locais
const serif = localFont({
  src: './fonts/NeueDisplay.woff2',
  display: 'swap',
})
```

Métricas alvo:
- **LCP < 2.5s** no mobile 4G simulado
- **CLS < 0.1** (nunca tem layout shift)
- **FID/INP < 200ms**

Teste sempre em mobile real antes de entregar.

## Acessibilidade mínima

- Contraste WCAG AA em TODOS os textos (inclusive CTAs)
- Label em todo input (visual ou `sr-only`)
- Foco visível em navegação por Tab
- Ordem lógica de heading (1 h1 por página)
- Alt text em toda imagem com informação

## Checklist final

Antes de entregar:

- [ ] Hero responde "o quê, para quem, por quê agora" em 3s
- [ ] CTA principal aparece 3+ vezes na página
- [ ] Prova social tem número ou nome real
- [ ] Garantia explicita o que cobre e o prazo
- [ ] Formulário tem no máximo 3 campos
- [ ] Mobile-first testado em telas de 375px
- [ ] Passou pela checagem de `anti-ia.md`
- [ ] LCP < 2.5s em mobile
- [ ] Texto de copy passou pela skill `23-copy` ou `24-copy-revisar`

## Copy é parte do design

Copy fraca mata conversão independente do design. Se a copy ainda não foi escrita ou revisada, acione a skill `23-copy` antes de fechar a landing.
