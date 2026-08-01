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

alter publication supabase_realtime add table community_messages;
