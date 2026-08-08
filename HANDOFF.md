# Handoff — o que falta para o app ficar 100%

Tudo neste arquivo depende de acesso que o código não tem: o SQL Editor do
Supabase, as variáveis da Vercel e o agendador. Enquanto não for feito, o
código está publicado mas parte dele fica parada.

---

## 1. Rodar as migrations pendentes (bloqueia o Motor Funil)

No **SQL Editor do Supabase**, na ordem, o conteúdo de cada arquivo de
`supabase/migrations/`:

| Arquivo | O que destrava | Como saber que faltou |
|---|---|---|
| `0007_realtime_chat.sql` | Mensagem do chat aparecer sem recarregar | Mensagem só aparece ao atualizar a página |
| `0008_moderation_actions_rls.sql` | RLS em `moderation_actions` | Tabela sem proteção de linha |
| `0009_allowed_competitions.sql` | Curadoria de competições por ID | `/admin/competições` em "modo de emergência" |
| `0010_funil_engine.sql` | O motor inteiro | `/admin/funil` mostra "Motor inativo" |
| `0011_admin_users_list.sql` | Ordenar o CRM por score | Coluna Score não ordena |

As migrations são idempotentes (`create table if not exists`, `on conflict
do nothing`), então rodar de novo não desfaz ajuste feito no painel.

**Confirmação nos logs da Vercel:** enquanto `0009` e `0010` não rodarem,
aparece `PGRST205 — Could not find the table`. Quando o erro sumir, rodou.

---

## 2. Ligar o agendador do Motor Funil

O motor é um ciclo no servidor. A rota existe e está publicada, mas
**ninguém a chama** — sem agendador, nada é analisado.

```
POST https://<seu-dominio>/api/funil/tick
Header: X-Automation-Secret: <AUTOMATIONS_CRON_SECRET>
Intervalo: 60 segundos
```

O secret é o mesmo já usado por `/api/automations/run-inactivity`.

Sugestão de agendador: **n8n**. O Vercel Cron no plano Hobby só permite
agendamento diário, o que não serve para partida ao vivo.

---

## 3. Variáveis de ambiente na Vercel

| Variável | Estado | Efeito de estar faltando |
|---|---|---|
| `SMARTICO_API_KEY` | **faltando** | Integração da casa parceira responde `smartico_not_configured` |
| `NEXT_PUBLIC_SITE_URL` | opcional | Sem ela, a URL vem do domínio de produção da Vercel. Só defina se usar domínio próprio |

---

## 4. Confirmar o endpoint de estatística ao vivo

A documentação que temos do Flashscore4 cobre `general/`, `teams/`,
`tournaments/` e `players/` — **nenhum endpoint `matches/*`**. E é de um
deles (`stats`) que saem ataques perigosos, posse, chutes e escanteios, ou
seja, tudo que o motor calcula.

O app **descobre o caminho sozinho** (`src/lib/sports/endpointResolver.ts`):
testa os candidatos, guarda o que responder e redescobre se parar de
funcionar. Mas os **nomes dos campos** só se confirmam com jogo ao vivo real.

Como conferir, depois das migrations:

1. Abrir `/admin/funil` → seção **Endpoints do provedor**
2. Se `stats` aparecer resolvido, o caminho está certo
3. Na seção **Diagnóstico de campos**, ver os rótulos que chegaram e os que
   ficaram vazios

Rótulo não reconhecido é ajuste de dicionário em
`src/lib/funil/normalize.ts`, não mudança de motor. Campo sem valor vira
`null` e a estratégia simplesmente não valida — nunca gera sinal errado.

Alternativa mais rápida: `GET /api/sports/health` devolve isso em JSON
(público, com cache de 10 min, sem expor chave nenhuma).

---

## 5. Liberar as estratégias do Funil (quando você quiser)

As seis nascem em **shadow mode**: o motor grava sinais, snapshots e
resultados, e **nada aparece para o usuário nem vira push**. Por isso
`/analises/funil` vai estar vazia mesmo com tudo funcionando — é
intencional.

Para liberar, em `/admin/funil`, por estratégia:
1. "Liberar aos usuários" (sai do shadow)
2. "Push: ligado", se quiser notificação

Recomendação: rodar ao menos uma rodada em shadow e conferir a tabela de
performance antes de liberar.

---

## Pendências conhecidas (não bloqueiam nada)

- **Push do Funil é tudo ou nada.** Quem tem push ativo recebe todos os
  sinais liberados; não dá para escolher "só cantos" nem desligar só o
  Funil sem desligar as notificações do app inteiro.
- **Backtest histórico** não existe. O motor já nasceu desacoplado para
  receber partida histórica, mas não há base minuto a minuto para alimentar.
- **Sem odds ao vivo.** A API só entrega o 1X2 pré-jogo, então o critério de
  odd nunca bloqueia um sinal — o card mostra a linha sugerida e "consulte a
  odd disponível". O campo já existe para o dia em que houver fonte.
