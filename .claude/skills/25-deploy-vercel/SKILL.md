---
name: 25-deploy-vercel
description: Deploy de aplicações na Vercel como preview ou produção. Use quando o usuário pedir "faz deploy", "coloca no ar", "manda pra Vercel" ou "cria um preview".
metadata:
  author: vercel
  version: "3.0.0"
---

# Deploy na Vercel

Faz deploy de qualquer projeto na Vercel. Sempre faça deploy como preview (não produção) a menos que o usuário peça explicitamente produção.

O objetivo é deixar o usuário no melhor setup de longo prazo: projeto linkado à Vercel com deploys por git-push. Todos os métodos abaixo tentam mover o usuário mais perto desse estado.

## Passo 1: diagnosticar o estado do projeto

Rode as 4 checagens abaixo antes de decidir o método:

```bash
# 1. Verifica se tem remote git
git remote get-url origin 2>/dev/null

# 2. Verifica se está linkado localmente à Vercel (qualquer um dos arquivos significa linkado)
cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null

# 3. Verifica se o Vercel CLI está instalado e autenticado
vercel whoami 2>/dev/null

# 4. Lista teams disponíveis (se autenticado)
vercel teams list --format json 2>/dev/null
```

### Seleção de team

Se o usuário pertence a múltiplos teams, mostre todos os slugs em lista e pergunte qual usar. Quando escolher, siga imediatamente para o próximo passo, sem pedir confirmação adicional.

Passe o slug do team via `--scope` em todos os comandos seguintes:

```bash
vercel deploy [path] -y --no-wait --scope <team-slug>
```

Se o projeto já está linkado (`.vercel/project.json` ou `.vercel/repo.json` existe), o `orgId` nesses arquivos determina o team, sem precisar perguntar de novo. Se há só um team (ou conta pessoal), pule o prompt e use direto.

Sobre o diretório `.vercel/`:

- `.vercel/project.json` é criado por `vercel link` (link de projeto único). Contém `projectId` e `orgId`.
- `.vercel/repo.json` é criado por `vercel link --repo` (link por repo). Contém `orgId`, `remoteName` e array `projects` mapeando diretórios pra IDs de projetos.

Qualquer um dos dois significa que o projeto está linkado. Checar os dois.

NÃO use `vercel project inspect`, `vercel ls` ou `vercel link` pra detectar estado em um diretório não linkado. Sem um config `.vercel/`, eles pedem prompt interativo (ou com `--yes` linkam silenciosamente como efeito colateral). Só `vercel whoami` é seguro rodar em qualquer lugar.

## Passo 2: escolher o método de deploy

### Linkado (`.vercel/` existe) + tem remote git → Git Push

Esse é o estado ideal. Projeto linkado com integração git.

1. Peça aprovação antes de fazer push. Nunca faça push sem aprovação explícita:
   "Este projeto está conectado à Vercel via git. Posso commit e push pra triggerar um deploy. Quer que eu prossiga?"

2. Commit e push:

```bash
git add .
git commit -m "deploy: <descrição das mudanças>"
git push
```

A Vercel constrói automaticamente a partir do push. Branches não-produção recebem preview; branch de produção (geralmente `main`) recebe deploy de produção.

3. Pegue a URL do preview. Se o CLI está autenticado:

```bash
sleep 5
vercel ls --format json
```

O JSON tem array `deployments`. Pegue o último, o campo `url` é a URL do preview.

Se o CLI não estiver autenticado, avise o usuário pra conferir o dashboard da Vercel ou o status do commit no provedor git.

### Linkado (`.vercel/` existe) + sem remote git → `vercel deploy`

Projeto linkado mas sem repo git. Deploy direto pelo CLI.

```bash
vercel deploy [path] -y --no-wait
```

Use `--no-wait` pra que o CLI retorne a URL imediatamente em vez de bloquear até o build terminar. Depois confira status:

```bash
vercel inspect <deployment-url>
```

Para deploy de produção (só se o usuário pedir):

```bash
vercel deploy [path] --prod -y --no-wait
```

### Não linkado + tem remote git → link e deploy

Precisa linkar primeiro. Pergunte ao usuário qual projeto Vercel usar ou se quer criar um novo.

```bash
# Linka ao projeto existente
vercel link --yes --scope <team-slug> --project <nome-do-projeto>

# Depois o deploy segue o fluxo "linkado + git"
```

Se for projeto novo, use o dashboard da Vercel pra importar o repo git. É o caminho mais confiável.

### Não linkado + sem remote git → deploy direto

```bash
vercel deploy [path] -y --no-wait
```

O CLI cria projeto novo automaticamente se não existe.

## Passo 3: confirmar sucesso

Depois do deploy:

1. Imprima a URL do preview pro usuário.
2. Se possível, confirme que o deploy deu certo:

```bash
vercel inspect <deployment-url> --format json
```

3. Se status for `ERROR`, pegue os logs:

```bash
vercel logs <deployment-url>
```

## Monitorando builds em andamento

Deploys podem levar minutos. Se o usuário quiser que você espere:

```bash
# Polling a cada 10s até terminar
while true; do
  status=$(vercel inspect <url> --format json | jq -r '.readyState')
  echo "Status: $status"
  if [ "$status" = "READY" ] || [ "$status" = "ERROR" ]; then break; fi
  sleep 10
done
```

## Rollback

Para reverter pra deploy anterior:

```bash
vercel rollback <deployment-url-anterior>
```

Ou via dashboard: Production Deployments > Promote to Production na versão desejada.

## Variáveis de ambiente

Adicionar via CLI:

```bash
vercel env add <NOME> production    # Pra produção
vercel env add <NOME> preview       # Pra preview
vercel env add <NOME> development   # Pra dev
```

Ou gerenciar via dashboard em Project Settings > Environment Variables.

## Domínios custom

```bash
vercel domains add <dominio>                        # Adiciona ao team
vercel domains add <dominio> --project <nome>       # Adiciona a projeto específico
vercel domains ls                                    # Lista domínios
```

DNS precisa apontar pra Vercel. Dashboard mostra os registros exatos (A ou CNAME) pra adicionar no seu provedor de DNS.

## Build falhou?

Caminho padrão de diagnóstico:

1. `vercel logs <url>` pega os logs completos do build.
2. Procure por erros de instalação (dependências) ou build (compile).
3. Se for problema de variável de ambiente, valide que ela existe pro ambiente certo.
4. Se for incompatibilidade de Node, ajuste versão via `engines` no `package.json` ou via config da Vercel.

## Múltiplos frameworks

Vercel detecta framework automaticamente. Se a detecção falhar, configure em `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

Ou via dashboard: Project Settings > Build & Development Settings.

## Coisas a nunca fazer sem aprovação explícita

- Fazer deploy direto em produção (use preview sempre).
- Fazer push pra main/master.
- Deletar projeto existente.
- Alterar domínio de produção.
- Modificar env vars de produção sem checkpoint.

## Resumo de comandos

| Ação | Comando |
|---|---|
| Deploy preview | `vercel deploy [path] -y --no-wait` |
| Deploy produção | `vercel deploy [path] --prod -y --no-wait` |
| Status | `vercel inspect <url>` |
| Logs | `vercel logs <url>` |
| Rollback | `vercel rollback <url>` |
| Linkar projeto | `vercel link --yes --project <nome>` |
| Quem sou | `vercel whoami` |
| Listar teams | `vercel teams list` |
| Adicionar env var | `vercel env add <NOME> <ambiente>` |
| Adicionar domínio | `vercel domains add <dominio>` |
