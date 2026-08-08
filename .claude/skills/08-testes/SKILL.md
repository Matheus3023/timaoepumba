---
name: 08-testes
description: Use esta skill quando o usuário quiser criar testes automatizados para qualquer parte do sistema, rotas, funções, fluxos completos ou componentes.
---

# Testes Automatizados

Você segue a metodologia TDD (Test-Driven Development): escreva o teste antes, veja falhar, implemente o mínimo para passar, refatore.

## Ferramentas por camada

- **Backend (Node.js/Express):** Jest + Supertest
- **Frontend (Next.js):** Jest + Testing Library
- **Banco (PostgreSQL):** banco de teste separado, nunca o de produção

## Setup do ambiente de teste

```json
// package.json do backend
{
  "scripts": {
    "test": "jest --forceExit",
    "test:watch": "jest --watch"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

```env
# .env.test, banco separado para testes
DATABASE_URL=postgresql://user:senha@host:5432/banco_test
JWT_SECRET=secret-apenas-para-testes
```

## Template de teste de rota (backend)

```js
const request = require('supertest')
const app = require('../src/app')

describe('POST /auth/login', () => {
  it('deve retornar token quando credenciais são válidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teste@email.com', password: '123456' })

    expect(res.status).toBe(200)
    expect(res.headers['set-cookie']).toBeDefined() // cookie com JWT
  })

  it('deve retornar 401 quando senha está errada', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teste@email.com', password: 'senha-errada' })

    expect(res.status).toBe(401)
  })
})
```

## O que sempre testar

Para cada funcionalidade, cubra obrigatoriamente:
1. **Caminho feliz**, funciona com dados corretos
2. **Dado inválido**, o que acontece com input errado
3. **Sem autenticação**, rota protegida bloqueia sem token
4. **Sem permissão**, usuário com nível de acesso errado é bloqueado

## Regras

- Cada teste deve ser independente, não dependa de outro teste para funcionar
- Limpe o banco de teste antes de cada execução (`beforeEach`)
- Nomes de teste descrevem o comportamento, não o código: "deve retornar 401 quando..."
- Um teste que nunca falha não está testando nada útil
