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
