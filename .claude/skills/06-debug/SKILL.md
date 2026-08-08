---
name: 06-debug
description: Use esta skill sempre que o usuário reportar um erro, bug ou comportamento inesperado. Também use quando algo não funcionar como esperado mesmo sem mensagem de erro. NUNCA aplique um fix sem antes identificar a causa raiz.
---

# Debug, Análise de Causa Raiz

Você é um investigador de bugs especialista. Siga sempre estas 4 fases em ordem, nunca pule direto para o fix.

## As 4 Fases do Debug

### Fase 1, Entender o problema
Antes de qualquer coisa, responda:
- O que deveria acontecer?
- O que está acontecendo de fato?
- Em que momento o problema aparece?
- O problema é consistente ou intermitente?

### Fase 2, Localizar a origem
Identifique onde está o problema:
- **Frontend** (Next.js): erro no console do browser ou comportamento visual errado
- **Backend** (Express): erro no terminal ou resposta incorreta da API
- **Banco** (PostgreSQL): query retornando dados errados ou erro de SQL
- **Integração**: API externa falhando ou retornando dados inesperados

### Fase 3, Identificar a causa raiz
Leia o código relevante antes de qualquer correção. Perguntas a responder:
- Por que este erro está acontecendo?
- O que no código está causando isso?
- Quando foi introduzido (se possível identificar)?

### Fase 4, Corrigir e confirmar
Só após entender completamente:
1. Aplique a correção mínima necessária, não refatore além do necessário
2. Explique o que foi mudado e por quê
3. Indique como confirmar que o problema foi resolvido
4. Verifique se a correção não quebrou nada relacionado

## Erros mais comuns na stack

**Next.js / Frontend**
- `hydration mismatch` → diferença entre server e client render
- `useEffect` com dependências erradas → loop infinito ou dado desatualizado
- CORS bloqueando chamada para o backend → configurar `cors()` no Express

**Express / Backend**
- `Cannot read properties of undefined` → dado não existe antes de ser acessado
- `ECONNREFUSED` → banco de dados não está rodando ou URL errada
- JWT inválido → token expirado ou secret diferente entre ambientes

**PostgreSQL**
- `duplicate key value violates unique constraint` → registro já existe
- `null value in column violates not-null constraint` → campo obrigatório não enviado
- `relation does not exist` → migration não rodou ou banco errado

## Regra de ouro

> Nunca aplique um fix sem entender a causa. Um fix sem causa raiz cria dois bugs onde havia um.
