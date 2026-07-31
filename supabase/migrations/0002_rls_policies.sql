-- ============================================================================
-- 0002_rls_policies.sql
-- Row Level Security (PRD secao 24)
--
-- Convention: end-user tables are readable/writable only by their owner via
-- the anon/authenticated Supabase client. All administrative and
-- cross-user operations (webhooks, CRM, dashboards, entitlement writes) go
-- through server-side code using the service role key, which bypasses RLS.
-- The service role key is never exposed to the frontend (see lib/supabase).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- users / user_profiles / user_preferences
-- ----------------------------------------------------------------------------
alter table users enable row level security;
alter table user_profiles enable row level security;
alter table user_preferences enable row level security;
alter table user_presence enable row level security;
alter table consents enable row level security;
alter table marketing_optouts enable row level security;
alter table push_subscriptions enable row level security;
alter table sessions enable row level security;

create policy "users_select_own" on users
  for select using (auth.uid() = id);
create policy "users_update_own" on users
  for update using (auth.uid() = id);

create policy "user_profiles_select_own" on user_profiles
  for select using (auth.uid() = user_id);
create policy "user_profiles_update_own" on user_profiles
  for update using (auth.uid() = user_id);

create policy "user_preferences_all_own" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_presence_all_own" on user_presence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "consents_select_own" on consents
  for select using (auth.uid() = user_id);
create policy "consents_insert_own" on consents
  for insert with check (auth.uid() = user_id);

create policy "marketing_optouts_select_own" on marketing_optouts
  for select using (auth.uid() = user_id);
create policy "marketing_optouts_insert_own" on marketing_optouts
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_all_own" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_select_own" on sessions
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Sports data: public read (via backend cache), no direct client writes
-- ----------------------------------------------------------------------------
alter table leagues enable row level security;
alter table teams enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;
alter table standings enable row level security;

create policy "leagues_public_read" on leagues for select using (true);
create policy "teams_public_read" on teams for select using (true);
create policy "matches_public_read" on matches for select using (true);
create policy "match_events_public_read" on match_events for select using (true);
create policy "standings_public_read" on standings for select using (true);

-- ----------------------------------------------------------------------------
-- Analyses: published+entitled content readable by authenticated users
-- ----------------------------------------------------------------------------
alter table analyses enable row level security;
alter table analysis_views enable row level security;
alter table analysis_reactions enable row level security;

create policy "analyses_published_read" on analyses
  for select using (status = 'published' and auth.role() = 'authenticated');

create policy "analysis_views_insert_own" on analysis_views
  for insert with check (auth.uid() = user_id);

create policy "analysis_reactions_all_own" on analysis_reactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Community: membership-gated read, own-message write
-- ----------------------------------------------------------------------------
alter table community_rooms enable row level security;
alter table community_members enable row level security;
alter table community_messages enable row level security;
alter table message_reactions enable row level security;
alter table message_reports enable row level security;

create policy "community_rooms_public_read" on community_rooms
  for select using (is_active = true);

create policy "community_members_select_own_or_room" on community_members
  for select using (auth.uid() = user_id);
create policy "community_members_insert_own" on community_members
  for insert with check (auth.uid() = user_id);

create policy "community_messages_select_member" on community_messages
  for select using (
    exists (
      select 1 from community_members m
      where m.room_id = community_messages.room_id and m.user_id = auth.uid()
    )
  );
create policy "community_messages_insert_member" on community_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from community_members m
      where m.room_id = community_messages.room_id and m.user_id = auth.uid()
    )
  );
create policy "community_messages_update_own" on community_messages
  for update using (auth.uid() = user_id);

create policy "message_reactions_all_own" on message_reactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "message_reports_insert_own" on message_reports
  for insert with check (auth.uid() = reported_by);
create policy "message_reports_select_own" on message_reports
  for select using (auth.uid() = reported_by);

-- ----------------------------------------------------------------------------
-- Everything else (tracking, affiliate, CRM, push campaigns, audit, admin
-- config) is written/read exclusively via server-side code using the
-- service role key. RLS is enabled with no policies -> deny-all for the
-- anon/authenticated roles, which is the safe default.
-- ----------------------------------------------------------------------------
alter table acquisition_sessions enable row level security;
alter table attribution_data enable row level security;
alter table tracking_events enable row level security;
alter table tracking_delivery_logs enable row level security;
alter table affiliate_configurations enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_events enable row level security;
alter table affiliate_webhook_logs enable row level security;
alter table registrations enable row level security;
alter table ftds enable row level security;
alter table entitlements enable row level security;
alter table crm_pipelines enable row level security;
alter table crm_stages enable row level security;
alter table crm_user_status enable row level security;
alter table crm_tags enable row level security;
alter table crm_user_tags enable row level security;
alter table crm_notes enable row level security;
alter table crm_tasks enable row level security;
alter table crm_timeline_events enable row level security;
alter table push_campaigns enable row level security;
alter table push_deliveries enable row level security;
alter table automation_runs enable row level security;
alter table audit_logs enable row level security;
alter table system_settings enable row level security;
alter table sports_api_cache enable row level security;
alter table sports_api_logs enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;

-- entitlements are read by the app to know which features are released
-- per access level (non-sensitive), so allow public read.
create policy "entitlements_public_read" on entitlements
  for select using (true);
