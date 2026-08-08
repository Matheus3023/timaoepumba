---
name: 22-automacao-browser
description: Automação completa de navegador, inclui estratégia de decisão (qual ferramenta usar) e execução via browser-use CLI. Use para testes web, páginas logadas, DevTools, extração de dados e preenchimento de formulários.
allowed-tools: Bash(browser-use:*)
---

# Automação de navegador com browser-use CLI

O comando `browser-use` oferece automação de navegador rápida e persistente. Um daemon em background mantém o navegador aberto entre comandos, com latência de cerca de 50ms por chamada.

## Pré-requisitos

```bash
browser-use doctor    # Verifica a instalação
```

Para detalhes de setup, veja https://github.com/browser-use/browser-use/blob/main/browser_use/skill_cli/README.md

## Fluxo principal

1. Navegar: `browser-use open <url>` abre o navegador headless e carrega a página.
2. Inspecionar: `browser-use state` retorna elementos clicáveis com índices.
3. Interagir: use os índices retornados (`browser-use click 5`, `browser-use input 3 "texto"`).
4. Verificar: `browser-use state` ou `browser-use screenshot` pra confirmar.
5. Repetir: o navegador fica aberto entre comandos.

Se um comando falhar, rode `browser-use close` pra limpar a sessão quebrada e tente de novo.

Pra usar o Chrome atual do usuário (preserva logins e cookies): rode `browser-use connect` antes.
Pra usar um navegador em nuvem: rode `browser-use cloud connect` antes.
Depois disso, os comandos funcionam igual.

## Modos de navegador

```bash
browser-use open <url>                         # Padrão: Chromium headless (sem setup)
browser-use --headed open <url>                # Janela visível (debug)
browser-use connect                            # Conecta ao Chrome do usuário (preserva logins/cookies)
browser-use cloud connect                      # Navegador em nuvem (zero-config, precisa de API key)
browser-use --profile "Default" open <url>     # Chrome real com perfil específico
```

Depois de `connect` ou `cloud connect`, todos os comandos seguintes vão pra aquele navegador, sem flags adicionais.

## Comandos

```bash
# Navegação
browser-use open <url>                    # Navegar pra URL
browser-use back                          # Voltar no histórico
browser-use scroll down                   # Scroll pra baixo (--amount N pixels)
browser-use scroll up                     # Scroll pra cima
browser-use tab list                      # Lista todas as abas
browser-use tab new [url]                 # Abre nova aba (vazia ou com URL)
browser-use tab switch <index>            # Troca aba por índice
browser-use tab close <index> [index...]  # Fecha uma ou mais abas

# Estado da página. Sempre rode state primeiro pra pegar índices de elementos
browser-use state                         # URL, título, elementos clicáveis com índices
browser-use screenshot [path.png]         # Screenshot (base64 se sem path, --full pra página inteira)

# Interações. Use os índices do state
browser-use click <index>                 # Clica elemento por índice
browser-use click <x> <y>                 # Clica em coordenadas
browser-use type "texto"                  # Digita no elemento focado
browser-use input <index> "texto"         # Clica no elemento e depois digita
browser-use keys "Enter"                  # Envia teclas (também "Control+a" etc)
browser-use select <index> "opcao"        # Seleciona opção de dropdown
browser-use upload <index> <path>         # Upload de arquivo
browser-use hover <index>                 # Passa mouse
browser-use dblclick <index>              # Duplo clique
browser-use rightclick <index>            # Clique direito

# Extração de dados
browser-use eval "js code"                # Executa JavaScript e retorna resultado
browser-use get title                     # Título da página
browser-use get html [--selector "h1"]    # HTML da página (ou escopado)
browser-use get text <index>              # Texto do elemento
browser-use get value <index>             # Valor de input/textarea
browser-use get attributes <index>        # Atributos do elemento
browser-use get bbox <index>              # Caixa delimitadora (x, y, largura, altura)

# Espera
browser-use wait selector "css"           # Espera elemento (--state visible|hidden|attached|detached, --timeout ms)
browser-use wait text "texto"             # Espera texto aparecer

# Cookies
browser-use cookies get [--url <url>]     # Pega cookies (opcional filtrar)
browser-use cookies set <name> <value>    # Define cookie (--domain, --secure, --http-only, --same-site, --expires)
browser-use cookies clear [--url <url>]   # Limpa cookies
browser-use cookies export <file>         # Exporta pra JSON
browser-use cookies import <file>         # Importa de JSON

# Sessão
browser-use close                         # Fecha navegador e daemon
browser-use sessions                      # Lista sessões ativas
browser-use close --all                   # Fecha todas as sessões
```

Para controle avançado (CDP, emulação de dispositivo, ativação de tab), veja `references/cdp-python.md`.

## Cloud API

```bash
browser-use cloud connect                 # Provisiona e conecta (zero-config)
browser-use cloud login <api-key>         # Salva API key (ou use BROWSER_USE_API_KEY)
browser-use cloud logout                  # Remove API key
browser-use cloud v2 GET /browsers        # Passagem REST (v2 ou v3)
browser-use cloud v2 POST /tasks '{"task":"...","url":"..."}'
browser-use cloud v2 poll <task-id>       # Consulta task até terminar
browser-use cloud v2 --help               # Mostra endpoints da API
```

`cloud connect` provisiona navegador em nuvem com perfil persistente (criado automaticamente na primeira vez), conecta via CDP e imprime URL ao vivo. `browser-use close` desconecta e para o navegador em nuvem. Para configurações custom (proxy, timeout, perfil específico), use `cloud v2 POST /browsers` diretamente com os parâmetros desejados.

### Auto-registro do agente

Use só se não tiver API key (checar com `browser-use doctor`). Se já estiver logado, pule.

1. `browser-use cloud signup` pega um desafio.
2. Resolver o desafio.
3. `browser-use cloud signup --verify <challenge-id> <resposta>` verifica e salva API key.
4. `browser-use cloud signup --claim` gera URL para um humano reivindicar a conta.

## Tunnels

```bash
browser-use tunnel <porta>                # Inicia Cloudflare tunnel (idempotente)
browser-use tunnel list                   # Mostra túneis ativos
browser-use tunnel stop <porta>           # Para túnel
browser-use tunnel stop --all             # Para todos
```

## Gestão de perfil

```bash
browser-use profile list                  # Lista navegadores e perfis detectados
browser-use profile sync --all            # Sincroniza perfis pra nuvem
browser-use profile update                # Baixa ou atualiza binário profile-use
```

## Encadeamento de comandos

Comandos podem ser encadeados com `&&`. O navegador persiste via daemon, então encadear é seguro e eficiente.

```bash
browser-use open https://example.com && browser-use state
browser-use input 5 "user@example.com" && browser-use input 6 "senha" && browser-use click 7
```

Encadeia quando não precisa de output intermediário. Roda separado quando precisa parsear `state` pra descobrir índices primeiro.

## Fluxos comuns

### Navegação autenticada

Quando a tarefa exige site logado (Gmail, GitHub, ferramentas internas), use perfis do Chrome:

```bash
browser-use profile list                           # Checa perfis disponíveis
# Pergunte ao usuário qual perfil usar, depois:
browser-use --profile "Default" open https://github.com  # Já logado
```

### Expondo servidores locais de dev

```bash
browser-use tunnel 3000                            # → https://abc.trycloudflare.com
browser-use open https://abc.trycloudflare.com     # Navega pelo túnel
```

## Múltiplos navegadores

Para fluxos com subagents ou múltiplos navegadores em paralelo, use `--session NOME`. Cada sessão tem seu próprio navegador. Veja `references/multi-session.md`.

## Configuração

```bash
browser-use config list                            # Mostra todas as configs
browser-use config set cloud_connect_proxy jp      # Define valor
browser-use config get cloud_connect_proxy         # Pega valor
browser-use config unset cloud_connect_timeout     # Remove valor
browser-use doctor                                 # Config e diagnósticos
browser-use setup                                  # Setup interativo pós-instalação
```

Config fica em `~/.browser-use/config.json`.

## Opções globais

| Opção | Descrição |
|---|---|
| `--headed` | Mostra janela do navegador |
| `--profile [NOME]` | Usa Chrome real (sem nome usa "Default") |
| `--cdp-url <url>` | Conecta via CDP URL (`http://` ou `ws://`) |
| `--session NOME` | Aponta pra sessão nomeada (padrão: "default") |
| `--json` | Saída como JSON |
| `--mcp` | Roda como servidor MCP via stdin/stdout |

## Dicas

1. Sempre rode `state` primeiro pra ver elementos disponíveis e seus índices.
2. Use `--headed` pra debug e ver o que o navegador tá fazendo.
3. Sessões persistem. O navegador fica aberto entre comandos.
4. Aliases do CLI: `bu`, `browser` e `browseruse` todos funcionam.
5. Se algum comando falhar, rode `browser-use close` primeiro e tente de novo.

## Troubleshooting

- Navegador não inicia? `browser-use close` e depois `browser-use --headed open <url>`.
- Elemento não encontrado? `browser-use scroll down` e depois `browser-use state`.
- Rodar diagnósticos: `browser-use doctor`.

## Cleanup

```bash
browser-use close                         # Fecha sessão do navegador
browser-use tunnel stop --all             # Para túneis (se houver)
```
