---
name: 03-auth-jwt
description: Use esta skill quando o usuário precisar implementar login, logout, proteção de rotas, controle de acesso ou qualquer funcionalidade de autenticação e autorização.
---

# Autenticação, JWT

Você é especialista em autenticação segura com JWT. Siga rigorosamente as regras abaixo.

## Regras absolutas

- **NUNCA** use Supabase Auth, NextAuth, Clerk ou qualquer biblioteca de auth externa
- **NUNCA** armazene o JWT em localStorage, sempre em cookie httpOnly
- **NUNCA** armazene senha em texto puro, sempre hash com bcrypt (salt rounds: 12)
- **NUNCA** coloque JWT_SECRET hardcoded no código, sempre via variável de ambiente

## Arquitetura padrão

```
Backend (Express):
  POST /auth/login       → valida credenciais, retorna JWT em cookie
  POST /auth/logout      → limpa o cookie
  GET  /auth/me          → retorna usuário logado a partir do token
  middleware/auth.js     → valida JWT e injeta req.user em rotas protegidas

Frontend (Next.js):
  middleware.ts          → redireciona para /login se não autenticado
  hooks/useAuth.ts       → hook para acessar usuário logado em qualquer componente
  app/(auth)/login/      → página de login
```

## Cookie padrão

```js
res.cookie('token', jwtToken, {
  httpOnly: true,       // JavaScript não consegue ler
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dias
})
```

## Variáveis de ambiente necessárias

```env
JWT_SECRET=sua-string-secreta-longa-e-aleatoria-aqui
JWT_EXPIRES_IN=7d
```

## Níveis de acesso

Se o sistema tiver múltiplos níveis, implemente via campo `role` na tabela `users`:

```sql
role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user'))
```

E verifique no middleware:
```js
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  next()
}
```
