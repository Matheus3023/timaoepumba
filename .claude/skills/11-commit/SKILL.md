---
name: 11-commit
description: Use esta skill quando o usuário quiser fazer um git commit. Analise as mudanças, gere uma mensagem descritiva e execute o commit. Sempre use quando o usuário disser "commita", "faz commit" ou "salva as mudanças no git".
disable-model-invocation: true
---

# Git Commit

Analise todas as mudanças pendentes e crie um commit com mensagem clara e padronizada.

## Processo

1. Execute `git status` para ver o que mudou
2. Execute `git diff` para entender o que foi alterado
3. Agrupe as mudanças por contexto (não commite arquivos não relacionados juntos)
4. Gere a mensagem no padrão Conventional Commits
5. Execute o commit

## Padrão de mensagem (Conventional Commits)

```
tipo: descrição curta em português (máx 72 caracteres)

[corpo opcional explicando o porquê da mudança]
```

**Tipos:**
| Tipo | Quando usar |
|------|-------------|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | reorganização sem mudar comportamento |
| `style` | mudança visual/CSS |
| `docs` | documentação |
| `test` | testes |
| `chore` | configuração, dependências |

## Exemplos

```
feat: adiciona listagem de leads com filtro por status

fix: corrige validação de email no formulário de cadastro

refactor: separa lógica de negócio em services no backend

deploy: adiciona Dockerfile para deploy no Coolify
```

## Regras

- Nunca commite arquivos `.env`, verifique antes
- Nunca use `git add .` sem revisar o que está sendo adicionado
- Uma mudança por commit, não misture feature com fix
- Se houver mudança no banco, mencione na mensagem: `feat: adiciona tabela de contratos`
