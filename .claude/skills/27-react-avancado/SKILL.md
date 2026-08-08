---
name: 27-react-avancado
description: Performance, composição e padrões avançados React/Next.js com 66 regras priorizadas por impacto. Cobre otimização de bundle, waterfalls, re-renders, compound components, composição e React 19.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Boas Práticas React/Next.js (Vercel)

Guia completo de otimização de performance para aplicações React e Next.js, mantido pela Vercel. Contém 58 regras em 8 categorias, priorizadas por impacto para orientar refatoração e geração de código.

## Quando aplicar

Use estas diretrizes quando estiver:

- Escrevendo novos componentes React ou páginas Next.js.
- Implementando data fetching (client ou server-side).
- Revisando código para problemas de performance.
- Refatorando código React/Next.js existente.
- Otimizando tamanho de bundle ou tempo de carregamento.

## Categorias por prioridade

| Prioridade | Categoria | Impacto | Prefixo |
|---|---|---|---|
| 1 | Eliminação de waterfalls | CRÍTICO | `async-` |
| 2 | Otimização de bundle | CRÍTICO | `bundle-` |
| 3 | Performance do lado servidor | ALTO | `server-` |
| 4 | Data fetching no cliente | MÉDIO-ALTO | `client-` |
| 5 | Otimização de re-renders | MÉDIO | `rerender-` |
| 6 | Performance de rendering | MÉDIO | `rendering-` |
| 7 | Performance de JavaScript | BAIXO-MÉDIO | `js-` |
| 8 | Padrões avançados | BAIXO | `advanced-` |

## Referência rápida

### 1. Eliminação de waterfalls (CRÍTICO)

- `async-defer-await`, mover await para dentro dos branches onde é realmente usado.
- `async-parallel`, usar `Promise.all()` para operações independentes.
- `async-dependencies`, usar better-all para dependências parciais.
- `async-api-routes`, começar promises cedo, dar await tarde em rotas de API.
- `async-suspense-boundaries`, usar Suspense para streamar conteúdo.

### 2. Otimização de bundle (CRÍTICO)

- `bundle-barrel-imports`, importar direto, evitar barrel files.
- `bundle-dynamic-imports`, usar `next/dynamic` para componentes pesados.
- `bundle-defer-third-party`, carregar analytics/logging depois da hidratação.
- `bundle-conditional`, carregar módulos só quando a feature é ativada.
- `bundle-preload`, preload em hover/focus para sensação de velocidade.

### 3. Performance do lado servidor (ALTO)

- `server-auth-actions`, autenticar server actions como rotas de API.
- `server-cache-react`, usar `React.cache()` para deduplicação por request.
- `server-cache-lru`, usar cache LRU para cache entre requests.
- `server-dedup-props`, evitar serialização duplicada em props de RSC.
- `server-hoist-static-io`, içar I/O estático (fontes, logos) para escopo de módulo.
- `server-serialization`, minimizar dados passados para client components.
- `server-parallel-fetching`, reestruturar componentes para paralelizar fetches.
- `server-after-nonblocking`, usar `after()` para operações não-bloqueantes.

### 4. Data fetching no cliente (MÉDIO-ALTO)

- `client-swr-dedup`, usar SWR para deduplicação automática.
- `client-event-listeners`, deduplicar event listeners globais.
- `client-passive-event-listeners`, usar passive listeners para scroll.
- `client-localstorage-schema`, versionar e minimizar dados em localStorage.

### 5. Otimização de re-renders (MÉDIO)

- `rerender-defer-reads`, não subscrever state usado só em callbacks.
- `rerender-memo`, extrair trabalho custoso em componentes memoizados.
- `rerender-memo-with-default-value`, içar props não-primitivas default.
- `rerender-dependencies`, usar dependências primitivas em effects.
- `rerender-derived-state`, subscrever booleans derivados, não valores raw.
- `rerender-derived-state-no-effect`, derivar state durante render, não em effects.
- `rerender-functional-setstate`, usar functional setState para callbacks estáveis.
- `rerender-lazy-state-init`, passar função para `useState` em valores custosos.
- `rerender-simple-expression-in-memo`, evitar memo para primitivos simples.
- `rerender-move-effect-to-event`, lógica de interação nos event handlers.
- `rerender-transitions`, usar `startTransition` para updates não-urgentes.
- `rerender-use-ref-transient-values`, usar refs para valores transientes frequentes.

### 6. Performance de rendering (MÉDIO)

- `rendering-animate-svg-wrapper`, animar div wrapper, não o elemento SVG.
- `rendering-content-visibility`, usar `content-visibility` para listas longas.
- `rendering-hoist-jsx`, extrair JSX estático para fora de componentes.
- `rendering-svg-precision`, reduzir precisão de coordenadas SVG.
- `rendering-hydration-no-flicker`, script inline para dados client-only.
- `rendering-hydration-suppress-warning`, suprimir mismatches esperados.
- `rendering-activity`, usar componente Activity para mostrar/esconder.
- `rendering-conditional-render`, usar ternário, não `&&`, para condicionais.
- `rendering-usetransition-loading`, preferir `useTransition` para loading state.

### 7. Performance de JavaScript (BAIXO-MÉDIO)

- `js-batch-dom-css`, agrupar mudanças de CSS por classes ou cssText.
- `js-index-maps`, usar Map para lookups repetidos.
- `js-cache-property-access`, cachear propriedades de objeto em loops.
- `js-cache-function-results`, cachear resultados em Map a nível de módulo.
- `js-cache-storage`, cachear leituras de localStorage/sessionStorage.
- `js-combine-iterations`, combinar múltiplos filter/map em um loop.
- `js-length-check-first`, checar length antes de comparação custosa.
- `js-early-exit`, retornar cedo em funções.
- `js-hoist-regexp`, içar criação de RegExp pra fora de loops.
- `js-min-max-loop`, usar loop para min/max em vez de sort.
- `js-set-map-lookups`, usar Set/Map para lookups O(1).
- `js-tosorted-immutable`, usar `toSorted()` para imutabilidade.

### 8. Padrões avançados (BAIXO)

- `advanced-event-handler-refs`, armazenar handlers em refs.
- `advanced-init-once`, inicializar app uma vez por load.
- `advanced-use-latest`, `useLatest` para refs de callback estáveis.

### 9. Arquitetura de componentes (ALTO)

- `architecture-avoid-boolean-props`, não adicionar props booleanas para customizar comportamento; use composição.
- `architecture-compound-components`, estruturar componentes complexos com contexto compartilhado.

### 10. Gerenciamento de estado (MÉDIO)

- `state-decouple-implementation`, provider é o único lugar que sabe como o state é gerenciado.
- `state-context-interface`, definir interface genérica com state, actions, meta para dependency injection.
- `state-lift-state`, mover state para providers para acesso entre siblings.

### 11. Padrões de implementação (MÉDIO)

- `patterns-explicit-variants`, criar componentes com variantes explícitas em vez de modos booleanos.
- `patterns-children-over-render-props`, usar children para composição em vez de `renderX` props.

### 12. APIs do React 19 (MÉDIO)

Só React 19+. Pule se usa React 18 ou anterior.

- `react19-no-forwardref`, não usar `forwardRef`; usar `use()` em vez de `useContext()`.

## Como usar

Leia os arquivos individuais de cada regra para explicações detalhadas e exemplos de código:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Cada arquivo de regra contém:

- Explicação rápida do porquê importa.
- Exemplo de código incorreto com explicação.
- Exemplo de código correto com explicação.
- Contexto adicional e referências.

## Documento completo

Para o guia completo com todas as regras expandidas, veja `AGENTS.md`.
