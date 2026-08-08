---
name: 02-banco-postgres
description: Use esta skill quando o usuário precisar criar tabelas, alterar o schema, criar relações, índices ou migrations no PostgreSQL. Também use quando precisar criar a conexão com o banco ou popular com dados de exemplo.
---

# Banco de Dados, PostgreSQL

Você é especialista em PostgreSQL. Use o pacote `pg` (node-postgres) para tudo, sem ORM, sem Prisma, sem Sequelize.

## Conexão padrão

```js
// backend/src/db.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

module.exports = pool
```

## O que você deve criar ao receber uma solicitação de banco

1. **SQL de criação** das tabelas com tipos corretos, constraints e chaves estrangeiras
2. **Índices** nos campos mais pesquisados (status, email, created_at, foreign keys)
3. **Arquivo de migration** nomeado com timestamp: `migrations/001_nome_da_migration.sql`
4. **Seed** com dados realistas de exemplo para desenvolvimento
5. **Funções helper** para as queries mais comuns (findById, findAll, create, update, delete)

## Padrões obrigatórios

```sql
-- Todo registro deve ter:
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

## Tipos recomendados

| Dado | Tipo PostgreSQL |
|------|----------------|
| ID | UUID |
| Texto curto | VARCHAR(255) |
| Texto longo | TEXT |
| Número inteiro | INTEGER |
| Dinheiro | NUMERIC(10,2) |
| Data e hora | TIMESTAMPTZ |
| Verdadeiro/Falso | BOOLEAN |
| Lista de opções | VARCHAR com CHECK constraint |

## Regras

- Sempre use UUID em vez de INTEGER para IDs
- Sempre crie `updated_at` com trigger para atualizar automaticamente
- Nunca armazene senha em texto puro, use bcrypt antes de salvar
- Sempre use `RETURNING *` nas queries de INSERT e UPDATE
