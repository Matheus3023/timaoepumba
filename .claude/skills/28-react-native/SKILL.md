---
name: 28-react-native
description: Boas práticas React Native e Expo para apps mobile performáticos. Use ao criar componentes React Native, otimizar listas, implementar animações ou trabalhar com módulos nativos e APIs de plataforma.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React Native Skills

Boas práticas completas para aplicações React Native e Expo. Contém regras em várias categorias cobrindo performance, animações, padrões de UI e otimizações específicas de plataforma.

## Quando aplicar

Use estas diretrizes quando estiver:

- Construindo apps React Native ou Expo.
- Otimizando performance de listas e scroll.
- Implementando animações com Reanimated.
- Trabalhando com imagens e mídia.
- Configurando módulos nativos ou fontes.
- Estruturando projetos monorepo com dependências nativas.

## Categorias por prioridade

| Prioridade | Categoria | Impacto | Prefixo |
|---|---|---|---|
| 1 | Performance de listas | CRÍTICO | `list-performance-` |
| 2 | Animação | ALTO | `animation-` |
| 3 | Navegação | ALTO | `navigation-` |
| 4 | Padrões de UI | ALTO | `ui-` |
| 5 | Gerenciamento de estado | MÉDIO | `react-state-` |
| 6 | Rendering | MÉDIO | `rendering-` |
| 7 | Monorepo | MÉDIO | `monorepo-` |
| 8 | Configuração | BAIXO | `fonts-`, `imports-` |

## Referência rápida

### 1. Performance de listas (CRÍTICO)

- `list-performance-virtualize`, usar FlashList para listas grandes.
- `list-performance-item-memo`, memoizar componentes de item.
- `list-performance-callbacks`, estabilizar referências de callback.
- `list-performance-inline-objects`, evitar objetos de estilo inline.
- `list-performance-function-references`, extrair funções para fora do render.
- `list-performance-images`, otimizar imagens em listas.
- `list-performance-item-expensive`, mover trabalho custoso para fora dos items.
- `list-performance-item-types`, usar tipos de item para listas heterogêneas.

### 2. Animação (ALTO)

- `animation-gpu-properties`, animar só transform e opacity.
- `animation-derived-value`, usar `useDerivedValue` para animações computadas.
- `animation-gesture-detector-press`, usar `Gesture.Tap` em vez de Pressable.

### 3. Navegação (ALTO)

- `navigation-native-navigators`, usar native stack e native tabs em vez de JS navigators.

### 4. Padrões de UI (ALTO)

- `ui-expo-image`, usar expo-image para todas as imagens.
- `ui-image-gallery`, usar Galeria para lightboxes.
- `ui-pressable`, Pressable em vez de TouchableOpacity.
- `ui-safe-area-scroll`, tratar safe areas em ScrollViews.
- `ui-scrollview-content-inset`, usar `contentInset` para headers.
- `ui-menus`, usar menus de contexto nativos.
- `ui-native-modals`, usar modals nativos quando possível.
- `ui-measure-views`, usar `onLayout`, não `measure()`.
- `ui-styling`, usar `StyleSheet.create` ou Nativewind.

### 5. Gerenciamento de estado (MÉDIO)

- `react-state-minimize`, minimizar subscriptions.
- `react-state-dispatcher`, usar padrão dispatcher para callbacks.
- `react-state-fallback`, mostrar fallback no primeiro render.
- `react-compiler-destructure-functions`, destructure para React Compiler.
- `react-compiler-reanimated-shared-values`, lidar com shared values no compiler.

### 6. Rendering (MÉDIO)

- `rendering-text-in-text-component`, embrulhar texto em componentes Text.
- `rendering-no-falsy-and`, evitar `&&` falsy para rendering condicional.

### 7. Monorepo (MÉDIO)

- `monorepo-native-deps-in-app`, manter dependências nativas no pacote do app.
- `monorepo-single-dependency-versions`, versão única entre pacotes.

### 8. Configuração (BAIXO)

- `fonts-config-plugin`, usar config plugins para fontes custom.
- `imports-design-system-folder`, organizar imports do design system.
- `js-hoist-intl`, içar criação de objeto Intl.

## Como usar

Leia os arquivos individuais de cada regra para explicações detalhadas e exemplos:

```
rules/list-performance-virtualize.md
rules/animation-gpu-properties.md
```

Cada arquivo contém:

- Explicação rápida do porquê importa.
- Exemplo de código incorreto com explicação.
- Exemplo de código correto com explicação.
- Contexto adicional e referências.

## Documento completo

Para o guia completo com todas as regras expandidas, veja `AGENTS.md`.
