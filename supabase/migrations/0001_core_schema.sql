-- ============================================================================
-- 0001_core_schema.sql
-- Timao e Pumba Tips — Plataforma esportiva com comunidade, CRM e conversao
-- Núcleo do banco de dados (PRD secao 22)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- ROLES & PERMISSIONS (secao 10 / 21.1)
-- ----------------------------------------------------------------------------
do $$ begin
  create type access_level as enum (
    'VISITOR',
    'APP_USER',
    'REGISTERED_USER',
    'FTD_USER',
    'RESTRICTED_USER',
    'ADMIN'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type admin_profile as enum (
    'administrador',
    'gestor',
    'midia',
    'analista',
    'moderador',
    'suporte',
    'somente_leitura'
  );
exception when duplicate_object then null;
end $$;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  admin_profile admin_profile,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- USERS (extends auth.users)
-- ----------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  lead_id text unique not null,
  email text unique not null,
  phone text,
  full_name text,
  date_of_birth date,
  age_confirmed boolean not null default false,
  access_level access_level not null default 'APP_USER',
  status text not null default 'active', -- active, restricted, suspended, deleted
  terms_accepted_version text,
  terms_accepted_at timestamptz,
  privacy_accepted_version text,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_lead_id on users(lead_id);
create index if not exists idx_users_access_level on users(access_level);
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- user_profiles: extended CRM/behavioral/onboarding fields (secao 15.1 + onboarding spec secao 7)
create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,

  -- favorites / preferences
  favorite_team_id uuid,
  favorite_leagues jsonb not null default '[]'::jsonb,
  alert_preferences jsonb not null default '{
    "new_analysis": true,
    "match_start": true,
    "live_goals": true,
    "community_news": true,
    "account_updates": true
  }'::jsonb,

  -- device / session snapshot
  last_device text,
  last_browser text,
  last_os text,
  last_seen_at timestamptz,

  -- PWA install tracking (onboarding secao 7)
  pwa_install_status text not null default 'not_requested',
  pwa_install_prompt_viewed_at timestamptz,
  pwa_install_clicked_at timestamptz,
  pwa_installed_at timestamptz,
  pwa_first_standalone_open_at timestamptz,
  pwa_install_decline_count integer not null default 0,
  pwa_install_last_declined_at timestamptz,

  -- Push notification tracking (onboarding secao 7)
  notification_permission text not null default 'not_requested',
  notification_prompt_viewed_at timestamptz,
  notification_permission_requested_at timestamptz,
  notification_permission_granted_at timestamptz,
  notification_permission_denied_at timestamptz,
  push_subscription_id uuid,
  push_subscription_created_at timestamptz,

  -- Onboarding completion
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  onboarding_skipped_at timestamptz,
  onboarding_step text not null default 'welcome', -- welcome, install, notifications, personalization, done

  -- responsible / CRM
  owner_admin_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_user_profiles_updated_at on user_profiles;
create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();

-- check constraints for enumerated status text fields
do $$ begin
  alter table user_profiles add constraint chk_pwa_install_status
    check (pwa_install_status in ('not_requested','prompt_viewed','accepted','dismissed','installed','unavailable'));
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table user_profiles add constraint chk_notification_permission
    check (notification_permission in ('not_requested','default','granted','denied','unsupported','subscription_failed'));
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- TRACKING & ATTRIBUTION (secao 6)
-- ----------------------------------------------------------------------------
create table if not exists acquisition_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  user_id uuid references users(id) on delete set null,
  visitor_id text not null,
  entry_page text,
  previous_page text,
  device text,
  browser text,
  os text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_acquisition_sessions_lead_id on acquisition_sessions(lead_id);
create index if not exists idx_acquisition_sessions_user_id on acquisition_sessions(user_id);

create table if not exists attribution_data (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  user_id uuid references users(id) on delete set null,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  campaign_id text,
  adset_id text,
  ad_id text,
  fbclid text,
  fbc text,
  fbp text,
  gclid text,
  ttclid text,

  touch_type text not null check (touch_type in ('first','last')),

  created_at timestamptz not null default now()
);
create index if not exists idx_attribution_data_lead_id on attribution_data(lead_id);
create unique index if not exists uq_attribution_first_touch on attribution_data(lead_id) where touch_type = 'first';

create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  user_id uuid references users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  source text not null default 'client', -- client | server
  created_at timestamptz not null default now()
);
create index if not exists idx_tracking_events_lead_id on tracking_events(lead_id);
create index if not exists idx_tracking_events_event_name on tracking_events(event_name);
create index if not exists idx_tracking_events_created_at on tracking_events(created_at);

create table if not exists tracking_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  tracking_event_id uuid references tracking_events(id) on delete cascade,
  destination text not null, -- meta | google | tiktok
  status text not null default 'pending', -- pending | sent | failed
  response_payload jsonb,
  error_message text,
  attempted_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AFFILIATE / CASA PARCEIRA (secao 9)
-- ----------------------------------------------------------------------------
create table if not exists affiliate_configurations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  registration_url text not null,
  subid_parameter text not null default 'subid',
  logo_url text,
  status text not null default 'active', -- active | inactive
  webhook_key text not null default encode(gen_random_bytes(16), 'hex'),
  webhook_secret text not null default encode(gen_random_bytes(32), 'hex'),
  accepted_events jsonb not null default '["registration","ftd"]'::jsonb,
  release_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_affiliate_configurations_updated_at on affiliate_configurations;
create trigger trg_affiliate_configurations_updated_at before update on affiliate_configurations
  for each row execute function set_updated_at();

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  lead_id text not null,
  affiliate_configuration_id uuid references affiliate_configurations(id) on delete set null,
  generated_url text not null,
  clicked_at timestamptz not null default now()
);
create index if not exists idx_affiliate_clicks_lead_id on affiliate_clicks(lead_id);
create index if not exists idx_affiliate_clicks_user_id on affiliate_clicks(user_id);

create table if not exists affiliate_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_configuration_id uuid references affiliate_configurations(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  lead_id text,
  event_type text not null check (event_type in ('registration','ftd')),
  transaction_id text not null,
  raw_payload jsonb not null,
  status text not null default 'processed', -- processed | duplicate | rejected
  created_at timestamptz not null default now()
);
create unique index if not exists uq_affiliate_events_txn on affiliate_events(event_type, transaction_id);
create index if not exists idx_affiliate_events_lead_id on affiliate_events(lead_id);

create table if not exists affiliate_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  affiliate_configuration_id uuid references affiliate_configurations(id) on delete set null,
  status_code integer,
  request_headers jsonb,
  request_body jsonb,
  validation_result text, -- ok | invalid_signature | invalid_payload | duplicate
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  affiliate_configuration_id uuid references affiliate_configurations(id) on delete set null,
  affiliate_event_id uuid references affiliate_events(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_registrations_user_id on registrations(user_id);

create table if not exists ftds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  affiliate_configuration_id uuid references affiliate_configurations(id) on delete set null,
  affiliate_event_id uuid references affiliate_events(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_ftds_user_id on ftds(user_id);

-- ----------------------------------------------------------------------------
-- ENTITLEMENTS (config-driven feature release, secao 7 / 10)
-- ----------------------------------------------------------------------------
create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  access_level access_level not null,
  feature_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (access_level, feature_key)
);

-- ----------------------------------------------------------------------------
-- SESSIONS / PRESENCE / PREFERENCES / CONSENTS
-- ----------------------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  device text,
  browser text,
  os text
);
create index if not exists idx_sessions_user_id on sessions(user_id);

create table if not exists user_presence (
  user_id uuid primary key references users(id) on delete cascade,
  status text not null default 'offline' check (status in ('online','away','offline')),
  current_page text,
  last_activity_at timestamptz not null default now(),
  session_started_at timestamptz,
  device text
);

create table if not exists user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  dark_mode boolean not null default true,
  language text not null default 'pt-BR',
  updated_at timestamptz not null default now()
);

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','marketing')),
  granted boolean not null,
  version text,
  granted_at timestamptz not null default now(),
  ip_address inet
);
create index if not exists idx_consents_user_id on consents(user_id);

create table if not exists marketing_optouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  opted_out_at timestamptz not null default now(),
  reason text
);

-- ----------------------------------------------------------------------------
-- PUSH NOTIFICATIONS (secao 17 + onboarding spec)
-- ----------------------------------------------------------------------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  fcm_token text not null unique,
  device text,
  browser text,
  status text not null default 'active' check (status in ('active','inactive','failed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

create table if not exists push_campaigns (
  id uuid primary key default gen_random_uuid(),
  internal_name text not null,
  category text not null check (category in ('transactional','content','community','promotional')),
  segment_id uuid,
  title text not null,
  message text not null,
  image_url text,
  internal_link text,
  scheduled_at timestamptz,
  status text not null default 'draft', -- draft | scheduled | sending | sent | canceled
  ab_test boolean not null default false,
  frequency_cap integer,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_push_campaigns_updated_at on push_campaigns;
create trigger trg_push_campaigns_updated_at before update on push_campaigns
  for each row execute function set_updated_at();

create table if not exists push_deliveries (
  id uuid primary key default gen_random_uuid(),
  push_campaign_id uuid references push_campaigns(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','delivered','opened','clicked','failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  failure_reason text
);
create index if not exists idx_push_deliveries_campaign on push_deliveries(push_campaign_id);
create index if not exists idx_push_deliveries_user on push_deliveries(user_id);

-- ----------------------------------------------------------------------------
-- CRM (secao 15)
-- ----------------------------------------------------------------------------
create table if not exists crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists crm_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references crm_pipelines(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (pipeline_id, name)
);

create table if not exists crm_user_status (
  user_id uuid primary key references users(id) on delete cascade,
  pipeline_id uuid references crm_pipelines(id) on delete set null,
  stage_id uuid references crm_stages(id) on delete set null,
  responsible_admin_id uuid,
  moved_at timestamptz not null default now()
);

create table if not exists crm_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text
);

create table if not exists crm_user_tags (
  user_id uuid not null references users(id) on delete cascade,
  tag_id uuid not null references crm_tags(id) on delete cascade,
  primary key (user_id, tag_id)
);

create table if not exists crm_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  author_admin_id uuid,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists crm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  assigned_admin_id uuid,
  title text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','done','canceled')),
  created_at timestamptz not null default now()
);

-- generic CRM/user timeline (secao 15.3)
create table if not exists crm_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_crm_timeline_user_id on crm_timeline_events(user_id, occurred_at desc);

-- ----------------------------------------------------------------------------
-- SPORTS DATA (secao 12)
-- ----------------------------------------------------------------------------
create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'flashscore4',
  provider_league_id text not null,
  name text not null,
  country text,
  logo_url text,
  created_at timestamptz not null default now(),
  unique (provider, provider_league_id)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'flashscore4',
  provider_team_id text not null,
  name text not null,
  logo_url text,
  country text,
  created_at timestamptz not null default now(),
  unique (provider, provider_team_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'flashscore4',
  provider_match_id text not null,
  league_id uuid references leagues(id) on delete set null,
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled', -- scheduled | live | finished | postponed | canceled
  kickoff_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_match_id)
);
create index if not exists idx_matches_kickoff on matches(kickoff_at);
create index if not exists idx_matches_status on matches(status);
drop trigger if exists trg_matches_updated_at on matches;
create trigger trg_matches_updated_at before update on matches
  for each row execute function set_updated_at();

create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  minute integer,
  event_type text not null, -- goal | yellow_card | red_card | substitution | var
  team_id uuid references teams(id) on delete set null,
  player_name text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_match_events_match_id on match_events(match_id);

create table if not exists standings (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  position integer,
  played integer,
  wins integer,
  draws integer,
  losses integer,
  goals_for integer,
  goals_against integer,
  points integer,
  updated_at timestamptz not null default now(),
  unique (league_id, team_id)
);

create table if not exists sports_api_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sports_api_cache_expires on sports_api_cache(expires_at);

create table if not exists sports_api_logs (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  status_code integer,
  success boolean not null default true,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ANALYSES (secao 13)
-- ----------------------------------------------------------------------------
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  description text,
  match_id uuid references matches(id) on delete set null,
  league_id uuid references leagues(id) on delete set null,
  scheduled_date date,
  scheduled_time time,
  market text,
  odds_at_publish numeric(10,2),
  risk_level text check (risk_level in ('baixo','medio','alto')),
  responsible_admin_id uuid,
  image_url text,
  tags jsonb not null default '[]'::jsonb,
  audience text not null default 'all',
  min_access_level access_level not null default 'REGISTERED_USER',
  status text not null default 'draft' check (status in ('draft','in_review','scheduled','published','closed','canceled')),
  publish_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_analyses_status on analyses(status);
drop trigger if exists trg_analyses_updated_at on analyses;
create trigger trg_analyses_updated_at before update on analyses
  for each row execute function set_updated_at();

create table if not exists analysis_views (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  source text, -- push | direct | community
  read_seconds integer,
  viewed_at timestamptz not null default now()
);
create index if not exists idx_analysis_views_analysis_id on analysis_views(analysis_id);

create table if not exists analysis_reactions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (analysis_id, user_id, reaction)
);

-- ----------------------------------------------------------------------------
-- COMMUNITY (secao 14)
-- ----------------------------------------------------------------------------
create table if not exists community_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  min_access_level access_level not null default 'REGISTERED_USER',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists community_members (
  room_id uuid not null references community_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'usuario' check (role in (
    'administrador','gestor','analista','moderador','suporte','usuario','usuario_restrito'
  )),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists community_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references community_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_message_id uuid references community_messages(id) on delete set null,
  content text not null,
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_community_messages_room_id on community_messages(room_id, created_at desc);

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references community_messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (message_id, user_id, reaction)
);

create table if not exists message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references community_messages(id) on delete cascade,
  reported_by uuid not null references users(id) on delete cascade,
  reason text,
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references users(id) on delete cascade,
  message_id uuid references community_messages(id) on delete set null,
  action_type text not null, -- delete_message | mute | suspend | block | warn
  reason text,
  performed_by uuid,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUTOMATIONS / AUDIT / SETTINGS
-- ----------------------------------------------------------------------------
create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_key text not null, -- account_created | affiliate_clicked | registration_confirmed | ftd_confirmed | inactivity | opt_out
  user_id uuid references users(id) on delete set null,
  status text not null default 'success' check (status in ('success','failed','skipped')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_type text not null default 'admin', -- admin | system | user
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
