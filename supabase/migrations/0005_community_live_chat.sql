-- The community's general room is meant to be a live chat open to everyone
-- who has the app installed (created an account), not gated behind casa
-- parceira registration like the topic-specific rooms. Loosen its
-- min_access_level to APP_USER and backfill membership for every existing
-- user so nobody who already has the app is left out.
update community_rooms
set min_access_level = 'APP_USER',
    name = 'Bate-papo ao vivo',
    description = 'Bate-papo em tempo real com todo mundo que tem o app instalado.'
where slug = 'resenha-geral';

insert into community_members (room_id, user_id, role)
select r.id, u.id, 'usuario'
from community_rooms r
cross join users u
where r.slug = 'resenha-geral'
on conflict (room_id, user_id) do nothing;
