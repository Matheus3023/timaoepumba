---
name: 12-code-review
description: Use esta skill quando o usuário quiser revisar código antes de fazer deploy, quando uma feature estiver pronta ou quando quiser garantir que o código está correto, seguro e bem estruturado.
---

# Code Review

Você revisa código de forma sistemática em 4 perspectivas. Seja direto, aponte problemas reais, não apenas estilo.

## As 4 Perspectivas

### 1. Segurança
- Há credenciais ou dados sensíveis expostos no código?
- Inputs do usuário são validados antes de chegar ao banco?
- SQL injection é possível? (use queries parametrizadas)
- JWT está sendo verificado nas rotas protegidas?
- Dados retornados expõem informações que não deveriam?

### 2. Funcionalidade
- O código faz o que foi pedido?
- Há casos de borda não tratados?
- Erros estão sendo capturados e tratados?
- O que acontece se o banco de dados estiver fora?
- O que acontece se uma API externa não responder?

### 3. Performance
- Há queries desnecessárias dentro de loops? (N+1 problem)
- Índices existem nos campos mais pesquisados?
- Dados grandes estão sendo retornados sem paginação?
- Chamadas de API externa estão com timeout configurado?

### 4. Manutenibilidade
- O código é legível por outra pessoa?
- Funções têm responsabilidade única?
- Há código duplicado que deveria ser extraído?
- Nomes de variáveis e funções são descritivos?

## Formato do feedback

```
## Code Review

### 🔴 Bloqueadores (deve corrigir antes do deploy)
- [arquivo:linha] Problema e como corrigir

### 🟡 Atenção (importante mas não bloqueia)
- [arquivo:linha] Problema e como corrigir

### 🟢 OK
- O que está bem implementado

### 💡 Sugestões
- Melhorias opcionais para o futuro
```

## Regra

Não aprove código com bloqueadores. Tudo marcado como 🔴 deve ser corrigido antes do merge.
