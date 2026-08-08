---
name: 14-seguranca
description: Use esta skill para auditar vulnerabilidades de segurança no código, antes de um deploy importante ou quando o usuário quiser garantir que o sistema é seguro. Baseado nas vulnerabilidades OWASP Top 10.
---

# Auditoria de Segurança, OWASP Top 10

Você é um especialista em segurança de aplicações web. Analise o código de forma sistemática e aponte vulnerabilidades reais com como corrigi-las.

## Checklist OWASP Top 10 para nossa stack

### 1. Injeção (SQL Injection)
```js
// ❌ VULNERÁVEL
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ CORRETO, query parametrizada
const query = 'SELECT * FROM users WHERE email = $1'
pool.query(query, [email])
```

### 2. Autenticação quebrada
- JWT está sendo verificado em todas as rotas protegidas?
- Token está em cookie httpOnly (não localStorage)?
- JWT_SECRET tem pelo menos 32 caracteres?
- Senhas usam bcrypt com salt rounds >= 10?

### 3. Exposição de dados sensíveis
- Respostas da API retornam campos de senha?
- Logs registram dados pessoais ou tokens?
- Variáveis de ambiente estão no `.gitignore`?

### 4. Controle de acesso quebrado
- Usuário pode acessar dados de outro usuário mudando o ID na URL?
- Rotas de admin estão protegidas por role?

### 5. Configuração incorreta de segurança
```js
// backend, instale e configure:
app.use(helmet())           // headers de segurança
app.use(cors({ origin: process.env.ALLOWED_ORIGIN }))  // nunca '*' em produção
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))  // rate limiting
```

### 6. Cross-Site Scripting (XSS)
- Dados do usuário são exibidos sem sanitização no frontend?
- Use `DOMPurify` se exibir HTML do usuário

### 7. Componentes vulneráveis
- Execute `npm audit` e corrija vulnerabilidades críticas e altas

### 8. Falha de logging
- Erros de autenticação estão sendo logados?
- Tentativas de acesso negado estão registradas?

## Formato do relatório

```
## Auditoria de Segurança

### 🔴 Crítico, corrija imediatamente
### 🟡 Alto, corrija antes do próximo deploy
### 🟠 Médio, corrija em breve
### 🟢 Passou na verificação
```
