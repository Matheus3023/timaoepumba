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
