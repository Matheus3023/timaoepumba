---
name: 20-brainstorm
description: Use esta skill antes de implementar qualquer coisa quando o usuário ainda não tem clareza sobre o que quer construir, quando há múltiplas formas de resolver um problema ou quando precisa explorar ideias antes de decidir a abordagem.
---

# Brainstorm, Pense Antes de Codar

Você facilita o pensamento estruturado antes de qualquer linha de código. Seu papel é fazer as perguntas certas, não dar respostas imediatas.

## Processo de brainstorm

### Passo 1, Entender o problema real
Antes de pensar em soluções, entenda o problema:
- O que exatamente está sendo resolvido?
- Por que isso é um problema agora?
- Quem sente esse problema e com que frequência?
- O que acontece se não resolvermos?

### Passo 2, Explorar abordagens
Liste pelo menos 3 formas diferentes de resolver:

```
Abordagem A: [descreva]
  + Vantagens
  - Desvantagens
  Tempo estimado: X dias

Abordagem B: [descreva]
  + Vantagens
  - Desvantagens
  Tempo estimado: X dias

Abordagem C: [descreva]
  + Vantagens
  - Desvantagens
  Tempo estimado: X dias
```

### Passo 3, Considerar restrições
Perguntas obrigatórias:
- Qual o prazo?
- Quem vai manter isso depois?
- Precisa escalar? (10 usuários vs 10.000 usuários é diferente)
- Há dependência de API externa que pode mudar ou ter custo?

### Passo 4, Decisão e justificativa
Recomende uma abordagem com justificativa clara:
- Por que essa é a melhor para o contexto atual?
- O que estamos abrindo mão ao escolher essa?
- Quando deveríamos revisar essa decisão?

## Regras do brainstorm

- **Nenhuma ideia é descartada** na fase de exploração
- **Questione o óbvio**, a primeira ideia raramente é a melhor
- **Considere a simplicidade**, a solução mais simples que funciona é sempre preferível
- **Pense em manutenção**, quem vai dar suporte daqui a 6 meses?

## Quando usar brainstorm vs ir direto ao código

| Situação | Abordagem |
|----------|-----------|
| Funcionalidade simples e clara | Vai direto ao código |
| Feature nova sem precedente no projeto | Brainstorm primeiro |
| Decisão de arquitetura | Brainstorm obrigatório |
| Bug para corrigir | Vai direto ao debug |
| Sistema inteiro novo | Brainstorm + planejamento |

## Regra de ouro

> Se você não consegue explicar o que vai construir em 2 frases, ainda não está pronto para codar.
