-- ============================================================================
-- 0003_seed.sql
-- Seed data: default roles, entitlements, community rooms, CRM pipeline
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Roles (secao 14.3 / 21.1)
-- ----------------------------------------------------------------------------
insert into roles (name, admin_profile, description) values
  ('Administrador', 'administrador', 'Acesso total ao painel e configuracoes'),
  ('Gestor', 'gestor', 'Gestao de campanhas, CRM e comunidade'),
  ('Midia', 'analista', 'Gestao de campanhas de midia paga'),
  ('Analista', 'analista', 'Publicacao de analises esportivas'),
  ('Moderador', 'moderador', 'Moderacao da comunidade'),
  ('Suporte', 'suporte', 'Atendimento e suporte a usuarios'),
  ('Somente leitura', 'somente_leitura', 'Acesso de visualizacao aos relatorios')
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
-- Entitlements: feature releases per access level (admin-configurable)
-- ----------------------------------------------------------------------------
insert into entitlements (access_level, feature_key, enabled) values
  ('VISITOR', 'view_landing', true),
  ('VISITOR', 'view_public_content', true),
  ('VISITOR', 'create_account', true),

  ('APP_USER', 'view_home', true),
  ('APP_USER', 'view_matches', true),
  ('APP_USER', 'set_preferences', true),
  ('APP_USER', 'start_affiliate_registration', true),

  ('REGISTERED_USER', 'community_access', true),
  ('REGISTERED_USER', 'community_comment', true),
  ('REGISTERED_USER', 'community_react', true),
  ('REGISTERED_USER', 'community_poll_vote', true),
  ('REGISTERED_USER', 'view_analyses_standard', true),

  ('FTD_USER', 'view_analyses_premium', true),
  ('FTD_USER', 'community_exclusive_rooms', true),
  ('FTD_USER', 'premium_content', true)
on conflict (access_level, feature_key) do nothing;

-- ----------------------------------------------------------------------------
-- Community rooms (secao 14.1)
-- ----------------------------------------------------------------------------
insert into community_rooms (slug, name, description, min_access_level, position) values
  ('resenha-geral', 'Resenha Geral', 'Bate-papo geral da comunidade', 'REGISTERED_USER', 1),
  ('jogos-de-hoje', 'Jogos de Hoje', 'Discussao sobre os jogos do dia', 'REGISTERED_USER', 2),
  ('brasileirao', 'Brasileirao', 'Campeonato Brasileiro', 'REGISTERED_USER', 3),
  ('champions-league', 'Champions League', 'Liga dos Campeoes da UEFA', 'REGISTERED_USER', 4),
  ('libertadores', 'Libertadores', 'Copa Libertadores da America', 'REGISTERED_USER', 5),
  ('futebol-internacional', 'Futebol Internacional', 'Ligas e competicoes internacionais', 'REGISTERED_USER', 6),
  ('jogos-ao-vivo', 'Jogos ao Vivo', 'Acompanhamento de partidas em tempo real', 'REGISTERED_USER', 7),
  ('analises-do-dia', 'Analises do Dia', 'Discussao sobre as analises publicadas', 'REGISTERED_USER', 8)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- CRM default pipeline (secao 15.2)
-- ----------------------------------------------------------------------------
insert into crm_pipelines (id, name, is_default)
values ('00000000-0000-0000-0000-000000000001', 'Pipeline Padrao', true)
on conflict (id) do nothing;

insert into crm_stages (pipeline_id, name, position) values
  ('00000000-0000-0000-0000-000000000001', 'Novo visitante', 1),
  ('00000000-0000-0000-0000-000000000001', 'Conta criada', 2),
  ('00000000-0000-0000-0000-000000000001', 'Clicou na casa', 3),
  ('00000000-0000-0000-0000-000000000001', 'Cadastro confirmado', 4),
  ('00000000-0000-0000-0000-000000000001', 'Comunidade liberada', 5),
  ('00000000-0000-0000-0000-000000000001', 'FTD confirmado', 6),
  ('00000000-0000-0000-0000-000000000001', 'Usuario ativo', 7),
  ('00000000-0000-0000-0000-000000000001', 'Usuario inativo', 8),
  ('00000000-0000-0000-0000-000000000001', 'Em reativacao', 9),
  ('00000000-0000-0000-0000-000000000001', 'Opt-out', 10),
  ('00000000-0000-0000-0000-000000000001', 'Bloqueado', 11)
on conflict (pipeline_id, name) do nothing;

-- ----------------------------------------------------------------------------
-- System settings defaults
-- ----------------------------------------------------------------------------
insert into system_settings (key, value) values
  ('onboarding_config', jsonb_build_object(
    'welcome_title', 'Sua conta esta pronta!',
    'welcome_text', 'Agora instale o aplicativo para acessar seus jogos, analises e a comunidade com mais rapidez.',
    'benefits', jsonb_build_array(
      'Acesso rapido pela tela inicial',
      'Alertas de novas analises',
      'Notificacoes de partidas',
      'Acesso a comunidade',
      'Atualizacoes importantes da conta'
    ),
    'install_button_label', 'INSTALAR APLICATIVO',
    'skip_install_button_label', 'CONTINUAR NO NAVEGADOR',
    'notifications_title', 'Nao perca nenhuma atualizacao',
    'notifications_text', 'Ative as notificacoes para receber avisos sobre novos conteudos, inicio de partidas, movimentacoes na comunidade e atualizacoes importantes da sua conta.',
    'notifications_button_label', 'ATIVAR NOTIFICACOES',
    'skip_notifications_button_label', 'AGORA NAO',
    'ios_instructions', jsonb_build_array(
      'Toque no botao de compartilhar do Safari.',
      'Escolha "Adicionar a Tela de Inicio".',
      'Confirme em "Adicionar".',
      'Abra o aplicativo pela nova imagem criada na tela inicial.'
    ),
    'reprompt_after_first_decline_hours', 48,
    'reprompt_after_second_decline_days', 7,
    'reprompt_after_third_decline', false,
    'install_step_enabled', true,
    'notifications_step_enabled', true,
    'onboarding_required', false
  ))
on conflict (key) do nothing;
