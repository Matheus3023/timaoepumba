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
