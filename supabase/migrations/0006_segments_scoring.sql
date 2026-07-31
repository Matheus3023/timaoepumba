-- ============================================================================
-- 0006_segments_scoring.sql
-- CRM PRD: dynamic segmentation + lead scoring foundation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Segmentation (PRD sec. 12): admin-defined, condition-based dynamic
-- segments. `definition` is a JSON array of typed conditions (ANDed
-- together) evaluated server-side by src/lib/segments/evaluate.ts against a
-- whitelisted set of condition types — not a raw SQL/query builder, so there
-- is no injection surface.
-- ----------------------------------------------------------------------------
create table if not exists crm_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  definition jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_crm_segments_updated_at on crm_segments;
create trigger trg_crm_segments_updated_at before update on crm_segments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Lead scoring (PRD sec. 13): four dimensions, computed on demand (not
-- streamed per-event) by src/lib/scoring/compute.ts from existing signals
-- (users/user_profiles/crm_timeline_events/push_deliveries/community_members
-- etc.) and cached here for fast listing/sorting.
-- ----------------------------------------------------------------------------
create table if not exists score_rules (
  key text primary key,
  dimension text not null check (dimension in ('intent', 'engagement', 'relationship')),
  points integer not null,
  description text not null
);

insert into score_rules (key, dimension, points, description) values
  ('account_created', 'intent', 10, 'Criou conta'),
  ('onboarding_completed', 'intent', 5, 'Concluiu onboarding'),
  ('affiliate_click_first', 'intent', 20, 'Clicou na casa'),
  ('affiliate_click_repeat', 'intent', 5, 'Clicou novamente na casa (por clique extra, max +15)'),
  ('registration_confirmed', 'intent', 35, 'Cadastro confirmado'),
  ('ftd_confirmed', 'intent', 50, 'FTD confirmado'),
  ('app_opened', 'engagement', 1, 'Abriu o aplicativo (por sessao, max +10)'),
  ('active_three_distinct_days', 'engagement', 5, 'Acessou em tres dias diferentes'),
  ('analysis_viewed', 'engagement', 3, 'Visualizou analise (por analise, max +15)'),
  ('favorite_added', 'engagement', 2, 'Favoritou time ou campeonato (max +6)'),
  ('community_joined', 'engagement', 5, 'Entrou na comunidade'),
  ('poll_answered', 'engagement', 3, 'Participou de enquete (max +9)'),
  ('message_sent', 'engagement', 2, 'Enviou mensagem valida (por mensagem, max +10)'),
  ('push_opened', 'relationship', 2, 'Abriu notificacao (por push, max +10)'),
  ('push_clicked', 'relationship', 4, 'Clicou em notificacao (por push, max +20)'),
  ('ignored_five_communications', 'relationship', -5, 'Ignorou cinco comunicacoes seguidas'),
  ('push_invalid_token', 'relationship', -10, 'Token de push invalido')
on conflict (key) do nothing;

create table if not exists user_scores (
  user_id uuid primary key references users(id) on delete cascade,
  intent_score integer not null default 0,
  engagement_score integer not null default 0,
  relationship_score integer not null default 0,
  total_score integer not null default 0,
  risk_blocked boolean not null default false,
  risk_reason text,
  calculated_at timestamptz not null default now()
);
create index if not exists idx_user_scores_total on user_scores(total_score desc);

-- ----------------------------------------------------------------------------
-- RLS: same convention as the rest of the CRM tables — enabled, no policies,
-- accessed only via the service-role client from server-side admin code.
-- ----------------------------------------------------------------------------
alter table crm_segments enable row level security;
alter table score_rules enable row level security;
alter table user_scores enable row level security;
