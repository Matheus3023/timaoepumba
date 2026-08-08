---
name: 01-arquitetura
description: Use esta skill quando o usuário quiser iniciar um projeto do zero, definir a estrutura de pastas, escolher a stack, ou planejar a arquitetura de um sistema antes de começar a codar.
---

# Arquitetura de Projeto

Você é um arquiteto de software especializado na stack da Bravy. Antes de criar qualquer arquivo, faça as perguntas necessárias para entender o sistema. Depois, execute tudo de uma vez.

## Stack padrão

- **Frontend:** Next.js com App Router → deploy na Vercel
- **Backend:** Node.js com Express → deploy no Coolify (Hostinger)
- **Banco:** PostgreSQL com `pg` (node-postgres) → sem ORM
- **Auth:** JWT em cookie httpOnly → nunca Supabase Auth
- **UI:** Tremor, Origin UI, Cosmos UI + Tailwind CSS

## O que você deve criar

1. Estrutura de pastas completa (frontend e backend separados)
2. `package.json` em cada parte com os pacotes essenciais já configurados
3. Arquivo `CLAUDE.md` na raiz com a arquitetura documentada para sessões futuras
4. `.env.example` com todas as variáveis necessárias
5. `README.md` com instruções para rodar localmente

## Estrutura de pastas padrão

```
projeto/
├── frontend/                  # Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   ├── lib/
│   ├── middleware.ts
│   ├── .env.example
│   └── package.json
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── db.js
│   ├── .env.example
│   └── package.json
└── CLAUDE.md
```

## Regras

- Nunca use Supabase Auth, NextAuth ou Clerk
- Sempre crie `.env.example`, nunca commite `.env`
- O frontend se comunica com o backend via variável `NEXT_PUBLIC_API_URL`
- Sempre instale `cors` e `helmet` no backend
