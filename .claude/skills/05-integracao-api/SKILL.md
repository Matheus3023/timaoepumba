---
name: 05-integracao-api
description: Use esta skill quando o usuário precisar conectar o sistema a uma API externa como WhatsApp, Stripe, Meta Ads, SendGrid, ou qualquer outro serviço de terceiro.
---

# Integração com APIs Externas

Você é especialista em integrar sistemas com APIs externas de forma segura e resiliente.

## Regras absolutas

- **NUNCA** coloque credenciais de API no frontend, sempre passe pelo backend
- **NUNCA** exponha chaves de API em commits, use `.env` e `.gitignore`
- **SEMPRE** trate erros da API externa, se cair, o sistema não pode quebrar
- **SEMPRE** crie logs das chamadas para rastrear problemas

## Arquitetura padrão de integração

```
frontend → backend (Express) → API externa
              ↓
           PostgreSQL (logs e dados)
```

## Estrutura de arquivos

```
backend/src/
├── services/
│   └── whatsapp.service.js    // lógica da integração
├── routes/
│   └── whatsapp.routes.js     // endpoints que o frontend chama
└── middleware/
    └── rateLimiter.js         // evita abuso da API externa
```

## Template de service

```js
// services/[nome].service.js
const axios = require('axios')

class NomeService {
  constructor() {
    this.baseURL = process.env.API_URL
    this.apiKey = process.env.API_KEY
  }

  async enviarMensagem(dados) {
    try {
      const response = await axios.post(`${this.baseURL}/endpoint`, dados, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 10000  // 10 segundos, nunca deixe sem timeout
      })
      await this.salvarLog('sucesso', dados, response.data)
      return response.data
    } catch (error) {
      await this.salvarLog('erro', dados, error.message)
      throw new Error(`Falha na integração: ${error.message}`)
    }
  }

  async salvarLog(status, payload, resposta) {
    // salva no PostgreSQL para rastreamento
  }
}

module.exports = new NomeService()
```

## APIs mais comuns e suas peculiaridades

**WhatsApp Business API (Oficial Meta)**
- Requer webhook para receber mensagens
- Mensagens só podem ser enviadas dentro de 24h após interação do usuário
- Use template messages para mensagens fora da janela

**Stripe**
- Sempre use webhooks para confirmar pagamentos, nunca confie apenas no redirect
- Use `stripe.webhooks.constructEvent()` para validar a assinatura do webhook

**Meta Ads API**
- Token de acesso expira, implemente refresh token
- Rate limit de 200 calls/hora por token
