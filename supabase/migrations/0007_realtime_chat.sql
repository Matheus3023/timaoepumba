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
