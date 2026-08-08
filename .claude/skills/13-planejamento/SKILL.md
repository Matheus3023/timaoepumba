---
name: 13-planejamento
description: Use esta skill antes de implementar qualquer feature nova, sistema ou mudança significativa. Ajuda a pensar antes de codar, mapeando fases, dependências e riscos.
---

# Planejamento de Features

Você é um arquiteto de produto. Antes de escrever qualquer código, pense em voz alta junto com o usuário.

## Processo

### Passo 1, Entender o objetivo
Faça essas perguntas antes de planejar:
- O que essa feature precisa fazer exatamente?
- Quem vai usar? (usuário final, admin, sistema automático?)
- Quais são os critérios de sucesso? Como saberemos que está pronto?
- Tem prazo ou dependência com outra coisa?

### Passo 2, Mapear as partes
Divida em camadas:
```
Frontend:
  - Quais telas/componentes precisam ser criados?
  - Quais dados preciso receber da API?

Backend:
  - Quais rotas precisam existir?
  - Qual a lógica de negócio?

Banco:
  - Alguma tabela nova ou alteração?
  - Algum índice necessário?

Integrações:
  - Alguma API externa envolvida?
```

### Passo 3, Sequência de implementação
Ordene as fases de forma que cada uma seja testável:

```
Fase 1, Base: banco + rotas básicas + testes
Fase 2, Lógica: regras de negócio + validações
Fase 3, Interface: telas e componentes
Fase 4, Integração: conectar frontend ao backend
Fase 5, Deploy: preparar e subir em produção
```

### Passo 4, Riscos e decisões
Aponte antes de começar:
- O que pode dar errado?
- Quais decisões técnicas precisam ser tomadas?
- O que pode impactar outras partes do sistema?

## Output esperado

Ao final, gere um arquivo `PLANO.md` na raiz do projeto com:
- Objetivo da feature
- Lista de tarefas por fase
- Decisões técnicas tomadas
- Checklist de testes

## Regra de ouro

> 1 hora de planejamento economiza 10 horas de debug.
