-- ============================================================================
-- TIMÃO E PUMBA — migrations pendentes, tudo numa colada só
--
-- COMO USAR
--   1. Supabase → SQL Editor → New query
--   2. Cole este arquivo INTEIRO
--   3. Run
--
-- Roda tudo numa transação: se qualquer comando falhar, NADA é aplicado e o
-- banco fica como estava. Não existe estado pela metade.
--
-- Pode rodar mais de uma vez sem medo: tudo é "if not exists" / "or replace"
-- / "on conflict do nothing". Rodar de novo não apaga nem desfaz ajuste que
-- você já tenha feito pelo painel.
--
-- Ao final aparece uma tabela de conferência com as 7 estruturas criadas.
-- ============================================================================

begin;


-- ############################################################################
-- ###  0007_realtime_chat.sql
-- ############################################################################

-- ============================================================================
-- 0007_realtime_chat.sql
-- Root cause of "mensagem enviada mas nao aparece no chat": community_messages
-- was never added to the `supabase_realtime` publication. The INSERT always
-- succeeded (RLS + the moderation trigger both passed), but Postgres never
-- emitted a replication event for it, so the postgres_changes subscription in
-- CommunityRoomChat (src/components/community/CommunityRoomChat.tsx) never
-- fired for ANYONE in the room — new messages only ever showed up after a
-- full page reload (which re-fetches initialMessages from the server).
-- ============================================================================

-- Guardado contra reexecucao: `alter publication ... add table` de uma tabela
-- que ja esta na publicacao levanta erro. Sem esta protecao, rodar a migration
-- duas vezes falha — e, se ela estiver dentro de uma transacao junto das
-- outras, derruba todas.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table community_messages;
  end if;
end $$;


-- ############################################################################
-- ###  0008_moderation_actions_rls.sql
-- ############################################################################

-- ============================================================================
-- 0008_moderation_actions_rls.sql
-- Security gap found in a full QA sweep: moderation_actions was the only
-- table in the schema created without `enable row level security`. Every
-- app-side usage (src/lib/moderation/actions.ts, src/lib/entitlements/
-- rules.ts, src/app/admin/comunidade/page.tsx) already goes through the
-- service-role client, which bypasses RLS regardless — so enabling it here
-- changes nothing for the app, it only closes off direct access via the
-- public anon key (which is embedded in every page load) to a table that
-- holds who was muted/banned/warned and why.
-- ============================================================================

alter table moderation_actions enable row level security;
-- no policies -> deny-all for anon/authenticated; only the service role (admin panel) reads/writes this.


-- ############################################################################
-- ###  0009_allowed_competitions.sql
-- ############################################################################

-- ============================================================================
-- 0009_allowed_competitions.sql
-- Competition curation PRD: replace the hardcoded keyword allowlist in
-- src/lib/sports/bestLeagues.ts with a DB-backed, ID-keyed allowlist an
-- admin curates from /admin/competicoes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- allowed_competitions
--
-- One row per competition the sports provider has ever returned. Rows are
-- created automatically by src/lib/sports/competitionRegistry.ts the first
-- time a competition shows up in an API response — nothing here is seeded,
-- because the provider's competition ids are not known ahead of time.
--
-- Only `is_active = true` rows are ever shown in the app. New competitions
-- default to inactive + requires_manual_review, so nothing reaches users
-- without an admin approving it (PRD sec. 9). The exception is the initial
-- classification pass, which pre-approves competitions that already matched
-- the previous keyword allowlist so the app doesn't go blank on rollout.
--
-- `gender` is set by us, not by the provider: the Flashscore4 response has
-- no gender field, so it's inferred from the competition name and defaults
-- to 'male'. This matches the PRD's own fallback rule — when gender can't be
-- identified, a match may only show if its competition id is allowlisted.
--
-- Fields from the PRD that the provider doesn't supply (country_code,
-- continent) are intentionally omitted rather than stored empty.
-- ----------------------------------------------------------------------------
create table if not exists allowed_competitions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'flashscore4',
  provider_competition_id text not null,

  -- Stable internal name; display_name is what the app renders (falls back
  -- to canonical_name). provider_name keeps the raw, possibly sponsored
  -- string ("LALIGA EA SPORTS") for admin reference.
  canonical_name text not null,
  display_name text,
  provider_name text not null,

  country_name text,
  competition_type text not null default 'unknown'
    check (competition_type in ('league', 'cup', 'national_team', 'unknown')),
  gender text not null default 'male' check (gender in ('male', 'female', 'unknown')),

  -- 1 = highest (Brasileirão, Libertadores, Champions…), 3 = secondary.
  priority integer not null default 3,
  logo_url text,

  is_active boolean not null default false,
  show_on_home boolean not null default true,
  show_live boolean not null default true,
  show_upcoming boolean not null default true,
  notifications_enabled boolean not null default false,

  requires_manual_review boolean not null default true,
  -- Set when auto-blocked by src/lib/sports/contentPolicy.ts (e.g. 'women',
  -- 'sub-20'), so the admin panel can explain why a row is off.
  blocked_reason text,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (provider, provider_competition_id)
);

create index if not exists idx_allowed_competitions_active
  on allowed_competitions(is_active, priority);
create index if not exists idx_allowed_competitions_review
  on allowed_competitions(requires_manual_review)
  where requires_manual_review = true;

drop trigger if exists trg_allowed_competitions_updated_at on allowed_competitions;
create trigger trg_allowed_competitions_updated_at before update on allowed_competitions
  for each row execute function set_updated_at();

-- RLS: same convention as the other admin-owned tables — enabled with no
-- policies, so it is reachable only through the service-role client used by
-- server-side code (the registry writer and the admin panel).
alter table allowed_competitions enable row level security;


-- ############################################################################
-- ###  0010_funil_engine.sql
-- ############################################################################

-- ============================================================================
-- 0010_funil_engine.sql
-- MOTOR FUNIL T&P (PRD sec. 36).
--
-- O motor roda no servidor, centralmente: um tick periodico coleta os jogos
-- ao vivo, normaliza, calcula e grava. O cliente so LE o resultado ja
-- processado — nenhuma regra matematica acontece no navegador.
--
-- Convencao de RLS igual a do resto do projeto: tabela com RLS ligada e sem
-- policy so e alcancavel pelo service-role. A unica excecao aqui e
-- live_strategy_signals, que precisa de leitura autenticada — e mesmo essa
-- so expoe linhas fora do shadow mode.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- strategy_configs
--
-- Parametros das estrategias (PRD secs. 37 e 38). Cada mudanca de regra cria
-- uma VERSAO nova em vez de editar a existente: sem isso nao da para
-- descobrir depois qual versao performou melhor, porque os sinais antigos
-- passariam a ser lidos com os limiares novos.
--
-- `is_current` marca qual versao o motor usa agora; as demais ficam para
-- historico. Um indice parcial garante uma unica versao corrente por
-- estrategia.
-- ----------------------------------------------------------------------------
create table if not exists strategy_configs (
  id uuid primary key default gen_random_uuid(),
  strategy_id text not null check (strategy_id in (
    'FUNIL_GOAL_HT',
    'FUNIL_GOAL_FT',
    'FUNIL_CORNER_HT_LIMIT',
    'FUNIL_CORNER_HT_ASIAN',
    'FUNIL_CORNER_FT_LIMIT',
    'FUNIL_CORNER_FT_ASIAN'
  )),
  version text not null default '1.0',
  is_current boolean not null default true,

  enabled boolean not null default true,
  -- PRD sec. 53: nascem em shadow. O motor grava tudo, o usuario nao ve nada
  -- e ninguem recebe push ate alguem liberar no painel.
  shadow_mode boolean not null default true,
  notification_enabled boolean not null default false,
  pre_signal_enabled boolean not null default true,
  cooldown_seconds integer not null default 180,

  -- Limiares e janelas (min_minute, max_minute, min_appm, min_cg_dominant,
  -- min_cg_total, min_shots_on_target_total, min_bo, min_rm, min_odd,
  -- score_contexts, pre_signal_lead_minutes, line_offset,
  -- block_on_unavailable). Em jsonb porque o conjunto de parametros difere
  -- por estrategia e vai crescer — uma coluna por limiar viraria uma tabela
  -- cheia de NULL e uma migration por ajuste de regra.
  params jsonb not null default '{}'::jsonb,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (strategy_id, version)
);

create unique index if not exists idx_strategy_configs_current
  on strategy_configs(strategy_id)
  where is_current;

drop trigger if exists trg_strategy_configs_updated_at on strategy_configs;
create trigger trg_strategy_configs_updated_at before update on strategy_configs
  for each row execute function set_updated_at();

alter table strategy_configs enable row level security;

-- ----------------------------------------------------------------------------
-- funil_fixtures
--
-- Uma linha por partida que o motor acompanhou. Guarda o que a resposta ao
-- vivo NAO devolve:
--
--  * odds pre-jogo — o payload de `matches/live` nao traz odds, e o BO
--    (PRD sec. 6) exige justamente as odds PRE-jogo. Congelamos aqui na
--    primeira vez que a partida aparece na lista do dia.
--  * o instante em que o minuto e as estatisticas mudaram pela ultima vez,
--    que e como detectamos intervalo (relogio travado em 45) e placar
--    congelado do provedor (PRD sec. 43).
--  * os totais de referencia para resolver os sinais depois (PRD sec. 34).
-- ----------------------------------------------------------------------------
create table if not exists funil_fixtures (
  provider text not null default 'flashscore4',
  provider_match_id text not null,

  league_id text,
  league_name text,
  country_name text,
  home_team_id text,
  home_team_name text,
  home_team_logo text,
  away_team_id text,
  away_team_name text,
  away_team_logo text,
  kickoff_at timestamptz,

  pre_match_home_odd numeric(8, 3),
  pre_match_draw_odd numeric(8, 3),
  pre_match_away_odd numeric(8, 3),

  status text,
  last_period text,
  last_minute integer,
  -- Quando o minuto mudou de valor pela ultima vez (nao quando foi visto).
  last_minute_changed_at timestamptz,
  last_stats_fingerprint text,
  last_stats_changed_at timestamptz,

  -- Referencias para resolucao dos sinais.
  ht_goals integer,
  ht_corners integer,
  final_goals integer,
  final_corners integer,
  settled boolean not null default false,

  -- Competicao que nao entrega estatistica ao vivo (PRD sec. 49): para de
  -- ser consultada, para nao gastar chamada de API a toa.
  unsupported_live_stats boolean not null default false,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (provider, provider_match_id)
);

create index if not exists idx_funil_fixtures_unsettled
  on funil_fixtures(settled, last_seen_at)
  where not settled;

drop trigger if exists trg_funil_fixtures_updated_at on funil_fixtures;
create trigger trg_funil_fixtures_updated_at before update on funil_fixtures
  for each row execute function set_updated_at();

alter table funil_fixtures enable row level security;

-- ----------------------------------------------------------------------------
-- funil_fixture_observations
--
-- Historico bruto minuto a minuto das partidas monitoradas. Nao esta na
-- lista da sec. 36 do PRD, mas e o que torna possivel o T&P MOMENTUM
-- (sec. 23) e o "ultimo escanteio" (sec. 2): o provedor nao entrega eventos
-- de escanteio nem janelas de 5/10 minutos, entao a unica fonte e o delta
-- entre coletas nossas.
--
-- Difere de signal_snapshots: aqui entram TODAS as partidas monitoradas,
-- inclusive as que nunca geraram sinal. E dado operacional de curta duracao,
-- expurgado pelo tick.
-- ----------------------------------------------------------------------------
create table if not exists funil_fixture_observations (
  id bigserial primary key,
  provider_match_id text not null,
  minute integer,
  period text,
  score_home integer,
  score_away integer,
  stats jsonb not null,
  collected_at timestamptz not null default now()
);

create index if not exists idx_funil_observations_match
  on funil_fixture_observations(provider_match_id, collected_at desc);

alter table funil_fixture_observations enable row level security;

-- ----------------------------------------------------------------------------
-- live_strategy_signals
--
-- Estado ATUAL de cada (partida, estrategia, versao, periodo). A chave unica
-- e exatamente a chave de deduplicacao da PRD sec. 28 — e o que impede a
-- mesma partida virar dez sinais porque a API atualizou dez vezes.
--
-- `period` entra na chave de proposito: o mesmo jogo pode gerar um sinal de
-- cantos no primeiro tempo e outro no segundo, e sao sinais distintos.
-- ----------------------------------------------------------------------------
create table if not exists live_strategy_signals (
  id uuid primary key default gen_random_uuid(),
  provider_match_id text not null,
  strategy_id text not null,
  strategy_version text not null,
  period text not null,

  state text not null check (state in (
    'MONITORING', 'PRE_SIGNAL', 'VALIDATED', 'ENTRY_AVAILABLE',
    'FINISHED', 'EXPIRED', 'REJECTED', 'DATA_INCOMPLETE', 'UNSUPPORTED_LIVE_STATS'
  )),
  -- Copia do shadow_mode do config no momento da avaliacao. Fica na linha,
  -- e nao so no config, porque a policy de leitura precisa decidir sem join
  -- e porque um sinal gravado em shadow deve continuar marcado como tal
  -- mesmo depois de a estrategia ser liberada.
  shadow boolean not null default true,

  minute integer,
  score_home integer,
  score_away integer,

  rule_results jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  data_quality text,
  tp_score integer,
  tp_class text,
  reason text,

  entry_market text,
  entry_line numeric(6, 2),
  entry_line_label text,
  entry_odd numeric(8, 3),
  -- Totais no instante da entrada, para resolver o sinal depois sem
  -- depender das estatisticas finais (PRD sec. 35).
  goals_at_entry integer,
  corners_at_entry integer,
  entered_at timestamptz,

  last_notified_state text,
  last_notified_at timestamptz,

  state_changed_at timestamptz not null default now(),
  last_evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (provider_match_id, strategy_id, strategy_version, period)
);

create index if not exists idx_live_signals_visible
  on live_strategy_signals(state, tp_score desc)
  where not shadow;
create index if not exists idx_live_signals_match
  on live_strategy_signals(provider_match_id);
create index if not exists idx_live_signals_entered
  on live_strategy_signals(entered_at)
  where entered_at is not null;

drop trigger if exists trg_live_signals_updated_at on live_strategy_signals;
create trigger trg_live_signals_updated_at before update on live_strategy_signals
  for each row execute function set_updated_at();

alter table live_strategy_signals enable row level security;

-- Leitura para usuarios autenticados, e somente fora do shadow mode. Sem
-- esta condicao um sinal em teste vazaria pela API do Supabase e pelo
-- Realtime, que e exatamente o que o shadow mode existe para evitar.
drop policy if exists "signals visible to authenticated users" on live_strategy_signals;
create policy "signals visible to authenticated users" on live_strategy_signals
  for select to authenticated
  using (not shadow);

-- ----------------------------------------------------------------------------
-- signal_snapshots
--
-- Fotografia completa do momento em que o sinal mudou de estado (PRD sec. 35).
-- Append-only e independente das estatisticas finais do jogo: reconstruir
-- "como estava aos 39'" a partir do placar final e impossivel.
-- ----------------------------------------------------------------------------
create table if not exists signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references live_strategy_signals(id) on delete cascade,
  provider_match_id text not null,
  state text not null,
  minute integer,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signal_snapshots_signal
  on signal_snapshots(signal_id, created_at desc);

alter table signal_snapshots enable row level security;

-- ----------------------------------------------------------------------------
-- signal_results
--
-- Resultado apurado automaticamente (PRD sec. 34). PUSH existe por causa da
-- linha asiatica, que devolve a aposta quando o total bate exatamente na
-- linha; VOID cobre o sinal que nao pode ser julgado (dado final ausente ou
-- mercado ja resolvido antes da entrada).
-- ----------------------------------------------------------------------------
create table if not exists signal_results (
  signal_id uuid primary key references live_strategy_signals(id) on delete cascade,
  result text not null default 'PENDING'
    check (result in ('PENDING', 'GREEN', 'RED', 'PUSH', 'VOID')),
  result_minute integer,
  resolving_event text,

  signal_created_at timestamptz,
  signal_minute integer,
  entry_line numeric(6, 2),
  entry_odd numeric(8, 3),
  score_at_entry text,

  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_signal_results_pending
  on signal_results(result)
  where result = 'PENDING';

drop trigger if exists trg_signal_results_updated_at on signal_results;
create trigger trg_signal_results_updated_at before update on signal_results
  for each row execute function set_updated_at();

alter table signal_results enable row level security;

-- ----------------------------------------------------------------------------
-- funil_notification_logs
--
-- Nome prefixado de proposito: o projeto ja tem push_deliveries (campanhas)
-- e tracking_delivery_logs (eventos). Um "notification_logs" generico seria
-- confundido com os dois.
--
-- Registra tambem o que NAO foi enviado e por que (cooldown, shadow mode),
-- que e o que permite auditar a deduplicacao da sec. 28.
-- ----------------------------------------------------------------------------
create table if not exists funil_notification_logs (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references live_strategy_signals(id) on delete set null,
  strategy_id text not null,
  kind text not null check (kind in ('pre_signal', 'validated', 'entry_available')),
  status text not null check (status in ('sent', 'failed', 'suppressed')),
  suppressed_reason text,
  recipients integer not null default 0,
  sent integer not null default 0,
  failed integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_funil_notification_logs_signal
  on funil_notification_logs(signal_id, created_at desc);

alter table funil_notification_logs enable row level security;

-- ----------------------------------------------------------------------------
-- strategy_performance
--
-- VIEW, nao tabela: o PRD sec. 36 pede para nao duplicar dado, e todo numero
-- aqui ja existe em live_strategy_signals + signal_results. Materializar
-- criaria uma segunda fonte de verdade que sai de sincronia.
--
-- Cobre as dimensoes da sec. 39: estrategia, versao, liga, pais e faixas de
-- minuto, APPM, CG e T&P Score. A taxa observada e historico, NAO promessa
-- de resultado futuro — o painel exibe esse aviso junto.
-- ----------------------------------------------------------------------------
create or replace view strategy_performance as
select
  s.strategy_id,
  s.strategy_version,
  f.league_name,
  f.country_name,
  case
    when s.minute is null then 'desconhecido'
    when s.minute < 30 then 'ate 29'
    when s.minute < 45 then '30-44'
    when s.minute < 60 then '45-59'
    when s.minute < 75 then '60-74'
    when s.minute < 86 then '75-85'
    else '86+'
  end as minute_band,
  case
    when (s.metrics ->> 'dominantAppm') is null then 'desconhecido'
    when (s.metrics ->> 'dominantAppm')::numeric < 1.0 then 'ate 0.99'
    when (s.metrics ->> 'dominantAppm')::numeric < 1.3 then '1.00-1.29'
    when (s.metrics ->> 'dominantAppm')::numeric < 1.6 then '1.30-1.59'
    else '1.60+'
  end as appm_band,
  case
    when (s.metrics ->> 'cgDominant') is null then 'desconhecido'
    when (s.metrics ->> 'cgDominant')::numeric < 10 then 'ate 9'
    when (s.metrics ->> 'cgDominant')::numeric < 15 then '10-14'
    when (s.metrics ->> 'cgDominant')::numeric < 20 then '15-19'
    else '20+'
  end as cg_band,
  case
    when s.tp_score is null then 'desconhecido'
    when s.tp_score < 50 then 'FRACO'
    when s.tp_score < 70 then 'EM OBSERVACAO'
    when s.tp_score < 85 then 'FORTE'
    else 'MUITO FORTE'
  end as tp_score_band,
  s.shadow,
  count(*) as signals,
  count(*) filter (where r.result = 'GREEN') as greens,
  count(*) filter (where r.result = 'RED') as reds,
  count(*) filter (where r.result = 'PUSH') as pushes,
  count(*) filter (where r.result = 'VOID') as voids,
  count(*) filter (where r.result = 'PENDING' or r.result is null) as pending,
  -- Denominador exclui PUSH, VOID e PENDING: devolucao nao e acerto nem
  -- erro, e sinal nao resolvido ainda nao diz nada.
  round(
    100.0 * count(*) filter (where r.result = 'GREEN')
    / nullif(count(*) filter (where r.result in ('GREEN', 'RED')), 0),
    1
  ) as observed_rate
from live_strategy_signals s
left join signal_results r on r.signal_id = s.id
left join funil_fixtures f
  on f.provider_match_id = s.provider_match_id and f.provider = 'flashscore4'
-- So sinais que chegaram a virar entrada contam para performance; monitorados
-- e rejeitados nao sao "sinais emitidos".
where s.entered_at is not null
group by 1, 2, 3, 4, 5, 6, 7, 8, 9;

-- ----------------------------------------------------------------------------
-- Realtime
--
-- A tela FUNIL AO VIVO acompanha os sinais por Realtime. Sem incluir a
-- tabela na publicacao, o subscribe conecta e simplesmente nunca recebe
-- nada — foi exatamente o que quebrou o chat na 0007.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_strategy_signals'
  ) then
    alter publication supabase_realtime add table live_strategy_signals;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed das seis estrategias (PRD sec. 51)
--
-- Espelha src/lib/funil/defaults.ts. O `on conflict do nothing` deixa a
-- migration idempotente e — mais importante — impede que rodar de novo
-- desfaca ajustes que o admin ja tenha feito pelo painel.
-- ----------------------------------------------------------------------------
insert into strategy_configs (strategy_id, version, is_current, enabled, shadow_mode, notification_enabled, pre_signal_enabled, cooldown_seconds, params)
values
  ('FUNIL_GOAL_HT', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 30, "max_minute": 45,
     "min_appm": 1.3, "min_cg_dominant": 10, "min_bo": 6, "min_rm": 100,
     "min_odd": 2.0, "pre_signal_lead_minutes": 5, "block_on_unavailable": []
   }'::jsonb),
  ('FUNIL_GOAL_FT', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 55, "max_minute": 85,
     "min_appm": 1.0, "min_cg_total": 30, "min_shots_on_target_total": 10,
     "min_odd": 1.6, "pre_signal_lead_minutes": 5, "block_on_unavailable": []
   }'::jsonb),
  ('FUNIL_CORNER_HT_LIMIT', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 37, "max_minute": 42,
     "min_appm": 1.0, "min_cg_dominant": 15, "min_odd": 1.7,
     "score_contexts": ["DRAW_0_0", "DRAW_1_1", "DOMINANT_LOSING_BY_1"],
     "pre_signal_lead_minutes": 5, "line_offset": 0.5, "block_on_unavailable": []
   }'::jsonb),
  ('FUNIL_CORNER_HT_ASIAN', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 38, "max_minute": 45,
     "min_appm": 1.0, "min_cg_dominant": 15, "min_odd": null,
     "score_contexts": ["DRAW_0_0", "DRAW_1_1", "DOMINANT_LOSING_BY_1"],
     "pre_signal_lead_minutes": 5, "line_offset": 1.0, "block_on_unavailable": []
   }'::jsonb),
  ('FUNIL_CORNER_FT_LIMIT', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 86, "max_minute": 89,
     "min_appm": 1.0, "min_cg_dominant": 15, "min_odd": 1.7,
     "score_contexts": ["DRAW_0_0", "DRAW_1_1", "DOMINANT_LOSING_BY_1"],
     "pre_signal_lead_minutes": 4, "line_offset": 0.5, "block_on_unavailable": []
   }'::jsonb),
  ('FUNIL_CORNER_FT_ASIAN', '1.0', true, true, true, false, true, 180, '{
     "min_minute": 83, "max_minute": 90,
     "min_appm": 1.0, "min_cg_dominant": 15, "min_odd": null,
     "score_contexts": ["DRAW_0_0", "DRAW_1_1", "DOMINANT_LOSING_BY_1"],
     "pre_signal_lead_minutes": 4, "line_offset": 1.0, "block_on_unavailable": []
   }'::jsonb)
on conflict (strategy_id, version) do nothing;


-- ############################################################################
-- ###  0011_admin_users_list.sql
-- ############################################################################

-- ============================================================================
-- 0011_admin_users_list.sql
-- Ordenacao por score na lista de usuarios do painel.
--
-- O problema: `total_score` vive em `user_scores`, nao em `users`. Ordenar a
-- lista por score exigiria trazer todo mundo para a memoria e ordenar aqui —
-- o que quebra a paginacao, porque a contagem total passaria a ser a da
-- pagina e nao a do filtro. Com 5 mil usuarios isso nao e uma opcao.
--
-- A saida e uma VIEW, nao uma coluna desnormalizada em `users`: coluna
-- copiada precisa de gatilho para nao sair de sincronia com a tabela de
-- score, e uma segunda fonte de verdade sempre acaba divergindo. A view
-- resolve no banco, no momento da consulta, sem duplicar nada.
--
-- `left join` de proposito: quem ainda nao teve score calculado precisa
-- continuar aparecendo na lista. Score ausente vira NULL, e o `nulls last`
-- na ordenacao mantem essas contas no fim em vez de fingir que valem zero.
-- ============================================================================

create or replace view admin_users_list as
select
  u.id,
  u.lead_id,
  u.full_name,
  u.email,
  u.phone,
  u.access_level,
  u.status,
  u.created_at,
  s.total_score
from users u
left join user_scores s on s.user_id = u.id;

-- A view herda a RLS das tabelas de origem. O painel a consulta pelo cliente
-- service-role (mesmo caminho de `users` hoje), entao nenhuma policy nova e
-- necessaria — e nenhum acesso novo e concedido ao cliente do navegador.

-- Indice para a ordenacao por score nao varrer a tabela inteira.
create index if not exists idx_user_scores_total on user_scores(total_score desc);


commit;

-- ============================================================================
-- Conferência: devem aparecer 7 linhas (6 tabelas + 1 view).
-- ============================================================================
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'allowed_competitions', 'strategy_configs', 'live_strategy_signals',
    'signal_snapshots', 'signal_results', 'funil_fixtures', 'admin_users_list'
  )
order by table_name;
