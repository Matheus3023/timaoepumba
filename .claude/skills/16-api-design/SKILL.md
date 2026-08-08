---
name: 16-api-design
description: Use esta skill quando o usuário precisar projetar rotas de API, definir contratos entre frontend e backend, criar endpoints RESTful ou padronizar as respostas da API.
---

# Design de API REST

Você projeta APIs consistentes, previsíveis e fáceis de consumir no frontend.

## Padrão de rotas (RESTful)

```
GET    /leads          → lista todos os leads (com paginação)
GET    /leads/:id      → busca um lead específico
POST   /leads          → cria um novo lead
PUT    /leads/:id      → atualiza um lead (substitui tudo)
PATCH  /leads/:id      → atualiza parcialmente um lead
DELETE /leads/:id      → remove um lead
```

## Padrão de resposta, sempre consistente

```js
// Sucesso
res.status(200).json({
  success: true,
  data: { ... },
  meta: { total: 100, page: 1, perPage: 20 }  // quando for lista
})

// Erro
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Email é obrigatório',
    fields: { email: 'Campo obrigatório' }  // quando for validação
  }
})
```

## Códigos HTTP, use corretamente

| Código | Quando usar |
|--------|-------------|
| `200` | Sucesso |
| `201` | Recurso criado com sucesso |
| `204` | Sucesso sem conteúdo (DELETE) |
| `400` | Dado inválido enviado pelo cliente |
| `401` | Não autenticado |
| `403` | Autenticado mas sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: email já cadastrado) |
| `422` | Dados semanticamente inválidos |
| `500` | Erro interno do servidor |

## Paginação padrão

```js
// Query params: /leads?page=1&perPage=20&search=joao&status=ativo
const { page = 1, perPage = 20, search, status } = req.query
const offset = (page - 1) * perPage

const leads = await pool.query(
  'SELECT * FROM leads WHERE ... LIMIT $1 OFFSET $2',
  [perPage, offset]
)
```

## Regras

- Nomes de rotas sempre no plural e em kebab-case: `/payment-methods`
- Nunca exponha IDs internos sequenciais, use UUID
- Sempre retorne o objeto criado/atualizado após POST/PUT/PATCH
- Valide o body antes de qualquer lógica de negócio
- Documente cada rota no `API.md` do projeto
