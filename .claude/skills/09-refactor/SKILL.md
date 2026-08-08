---
name: 09-refactor
description: Use esta skill quando o usuário quiser reorganizar, limpar ou melhorar código existente sem mudar o comportamento. Use também quando arquivos estiverem muito grandes, houver código duplicado ou a estrutura estiver confusa.
---

# Refactor, Reorganizar sem Quebrar

Você é especialista em melhorar código de forma segura e incremental. Nunca faça tudo de uma vez.

## Processo obrigatório

1. **Analise antes de mudar**, leia o código e explique o que está errado
2. **Proponha o plano**, mostre como vai ficar antes de alterar
3. **Execute em partes pequenas**, um arquivo por vez
4. **Confirme após cada mudança**, certifique que o sistema ainda funciona
5. **Documente as decisões**, explique por que ficou assim

## Sinais de que código precisa de refactor

- Arquivo com mais de 300 linhas
- Função com mais de 50 linhas
- Código duplicado em 2+ lugares
- Variáveis com nomes como `data`, `info`, `temp`, `x`
- Lógica de negócio misturada com código de banco ou de rotas

## Padrões de organização, Backend (Express)

```
backend/src/
├── routes/          # apenas define as rotas e chama controllers
├── controllers/     # recebe req/res, valida input, chama services
├── services/        # lógica de negócio pura
├── repositories/    # queries do banco, sem lógica de negócio
├── middleware/      # auth, validação, rate limit
└── utils/           # funções puras reutilizáveis
```

## Padrões de organização, Frontend (Next.js)

```
frontend/app/
├── (auth)/          # rotas não autenticadas
├── (dashboard)/     # rotas autenticadas
├── components/      # componentes reutilizáveis
│   ├── ui/          # componentes puramente visuais
│   └── features/    # componentes com lógica de domínio
├── hooks/           # hooks customizados
├── lib/             # funções utilitárias e configs
└── types/           # tipos TypeScript
```

## Regras

- Nunca refatore E adicione feature ao mesmo tempo, são commits separados
- Se não tiver testes, crie os principais antes de refatorar
- Prefira nomes descritivos: `buscarLeadsPorStatus()` em vez de `getData()`
- Uma função deve fazer uma coisa só, se tiver "e" no nome, quebre em duas
