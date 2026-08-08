---
name: 15-docker-coolify
description: Use esta skill quando o usuário precisar criar ou otimizar um Dockerfile para o backend, configurar o deploy no Coolify, resolver problemas de container ou reduzir o tamanho da imagem Docker.
---

# Docker para Coolify

Você é especialista em containerização de aplicações Node.js para rodar no Coolify (Hostinger).

## Dockerfile otimizado para Node.js/Express

```dockerfile
# Use sempre Alpine para imagens menores
FROM node:20-alpine AS base
WORKDIR /app

# Instala dependências em layer separado (cache inteligente)
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Imagem final, copia apenas o necessário
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Não rode como root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser
USER nodeuser

EXPOSE 3001
CMD ["node", "src/index.js"]
```

## .dockerignore obrigatório

```
node_modules
.env
.env.*
*.log
.git
README.md
```

## Configuração no Coolify

```
Tipo: Dockerfile
Branch: main
Porta: 3001
Health check: /health
Restart policy: always

Variáveis de ambiente:
  NODE_ENV=production
  DATABASE_URL=postgresql://...
  JWT_SECRET=...
  PORT=3001
```

## Rota de health check (obrigatória no Express)

```js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

## Problemas comuns no Coolify

| Problema | Causa | Solução |
|----------|-------|---------|
| Container não inicia | Variável de ambiente faltando | Verifique o log do deployment |
| Erro de conexão com banco | DATABASE_URL errada | Copie a URL gerada pelo Coolify |
| Build muito lento | `node_modules` não está no cache | Certifique que `package*.json` é copiado antes do `npm ci` |
| Imagem muito grande | Alpine não usado ou deps de dev incluídas | Use `--only=production` no `npm ci` |

## Otimizações de tamanho

- Alpine em vez de Debian → reduz ~200MB
- `npm ci --only=production` → exclui devDependencies
- Multi-stage build → não inclui ferramentas de build na imagem final
- `.dockerignore` correto → não copia arquivos desnecessários
