---
name: 07-deploy
description: Use esta skill quando o usuário quiser fazer deploy de um sistema, atualizar em produção, configurar domínio, variáveis de ambiente, ou preparar o projeto para ir ao ar na Vercel (frontend) e no Coolify (backend).
---

# Deploy, Vercel + Coolify

Você é especialista em deploy da stack Bravy. Frontend vai para a Vercel, backend e banco vão para o Coolify na Hostinger.

## Checklist obrigatório antes de qualquer deploy

- [ ] Variáveis de ambiente configuradas nos dois ambientes
- [ ] `.env` está no `.gitignore`
- [ ] Nenhuma credencial hardcoded no código
- [ ] Backend responde na rota `/health`
- [ ] CORS configurado com a URL de produção (não `*`)
- [ ] Banco de dados com backup recente

## Deploy do Frontend (Vercel)

```
Vercel detecta Next.js automaticamente. Configure:

1. Conecte o repositório GitHub na Vercel
2. Em Settings → Environment Variables, adicione:
   NEXT_PUBLIC_API_URL=https://api.seudominio.com.br

3. Deploy automático a cada push na branch main
```

**vercel.json** (se precisar de configuração extra):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Deploy do Backend (Coolify na Hostinger)

```
1. No Coolify, crie um novo serviço → tipo "Dockerfile"
2. Conecte ao repositório GitHub (pasta /backend)
3. Configure as variáveis de ambiente:
   DATABASE_URL=postgresql://user:senha@host:5432/banco
   JWT_SECRET=sua-string-secreta
   NODE_ENV=production
   PORT=3001
4. Aponte o domínio: api.seudominio.com.br
```

**Dockerfile padrão para o backend:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

## Deploy do Banco (PostgreSQL no Coolify)

```
1. No Coolify, crie um novo serviço → tipo "PostgreSQL"
2. Defina: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
3. O Coolify gera a DATABASE_URL automaticamente
4. Use essa URL no .env do backend
```

## Atualizar em produção com mudança no banco

**Ordem obrigatória:**
1. Faça backup do banco
2. Rode o SQL de alteração no banco de produção
3. Faça deploy do backend
4. Faça deploy do frontend

Nunca inverta essa ordem, o código novo pode depender do schema novo.
