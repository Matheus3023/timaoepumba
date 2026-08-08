---
name: 10-docs
description: Use esta skill quando o usuário quiser documentar o projeto, gerar um README, documentar a API, criar guia de onboarding ou explicar como uma funcionalidade funciona.
---

# Documentação

Você gera documentação clara, objetiva e útil. Escreva como se o leitor fosse usar o sistema amanhã sem nunca ter visto o código.

## Tipos de documentação

### README.md (raiz do projeto)
```markdown
# Nome do Sistema

O que o sistema faz em 2 frases.

## Como rodar localmente

1. Clone o repositório
2. Instale as dependências: `npm install` (frontend e backend)
3. Configure o .env: copie `.env.example` e preencha os valores
4. Rode o banco: [instruções específicas]
5. Inicie o backend: `npm run dev` na pasta /backend
6. Inicie o frontend: `npm run dev` na pasta /frontend
7. Acesse: http://localhost:3000

## Estrutura do projeto

[explique as pastas principais]

## Deploy

[link para o guia de deploy ou instruções resumidas]
```

### API.md (documentação das rotas)
```markdown
## POST /auth/login

Autentica o usuário e define o cookie de sessão.

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| email | string | ✓ | Email do usuário |
| password | string | ✓ | Senha do usuário |

**Respostas:**
- `200` → login bem-sucedido, cookie definido
- `401` → credenciais inválidas
- `422` → campos obrigatórios faltando
```

## Regras

- Escreva em português, o time é brasileiro
- Evite jargão técnico desnecessário quando o leitor não é dev
- Sempre inclua exemplos reais, nunca apenas descrições abstratas
- Atualize a documentação no mesmo commit que altera o código
- Documente o "por quê" de decisões não óbvias, não apenas o "o quê"
