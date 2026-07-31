-- ============================================================================
-- 0004_moderation.sql
-- Community moderation enforcement (PRD sec. 14.4/24):
--  - block external links from regular users unless explicitly authorized
--  - filter banned words
--  - block muted/restricted users from posting
-- Enforced with a DB trigger so it can't be bypassed by calling the
-- Supabase client directly (the browser client writes community_messages
-- straight through RLS, with no server-side route in between).
-- ============================================================================

create table banned_words (
  id uuid primary key default gen_random_uuid(),
  word text unique not null,
  created_at timestamptz not null default now()
);
alter table banned_words enable row level security;
-- no policies -> deny-all for anon/authenticated; only the service role (admin panel) manages this list.

create or replace function enforce_message_content_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_role text;
  restricted boolean;
  privileged_roles text[] := array['administrador', 'gestor', 'analista', 'moderador', 'suporte'];
  banned record;
  masked text;
begin
  select role into member_role
  from community_members
  where room_id = new.room_id and user_id = new.user_id;

  if member_role is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  if member_role = 'usuario_restrito' then
    raise exception 'user_muted' using errcode = '42501';
  end if;

  select (access_level = 'RESTRICTED_USER') into restricted from users where id = new.user_id;
  if restricted then
    raise exception 'user_restricted' using errcode = '42501';
  end if;

  -- Links: only privileged roles may post URLs (PRD 14.4 "usuarios comuns
  -- nao poderao enviar links externos sem autorizacao").
  if not (member_role = any(privileged_roles)) and new.content ~* '(https?://|www\.)' then
    raise exception 'links_not_allowed' using errcode = '23514';
  end if;

  -- Banned words: mask matches instead of rejecting outright, so a single
  -- flagged word doesn't lose the rest of a legitimate message.
  masked := new.content;
  for banned in select word from banned_words loop
    masked := regexp_replace(
      masked,
      '\m' || banned.word || '\M',
      repeat('*', length(banned.word)),
      'gi'
    );
  end loop;
  new.content := masked;

  return new;
end;
$$;

create trigger trg_enforce_message_content_rules
  before insert on community_messages
  for each row execute function enforce_message_content_rules();

-- ----------------------------------------------------------------------------
-- Reactivation automation support (PRD sec. 19.5)
-- ----------------------------------------------------------------------------
insert into crm_tags (name, color) values
  ('Reativacao D3', '#eab308'),
  ('Reativacao D7', '#f97316'),
  ('Reativacao D15', '#ef4444')
on conflict (name) do nothing;
