/**
 * Hand-written Supabase schema types matching supabase/migrations/*.sql.
 * Covers the tables the application code queries directly. Regenerate/extend
 * with `supabase gen types typescript` once a live project is linked.
 */

export type AccessLevel =
  | "VISITOR"
  | "APP_USER"
  | "REGISTERED_USER"
  | "FTD_USER"
  | "RESTRICTED_USER"
  | "ADMIN";

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type UserRow = {
  id: string;
  lead_id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  age_confirmed: boolean;
  access_level: AccessLevel;
  status: string;
  terms_accepted_version: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_version: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type UserProfileRow = {
  user_id: string;
  favorite_team_id: string | null;
  favorite_leagues: string[];
  alert_preferences: Record<string, boolean>;
  last_device: string | null;
  last_browser: string | null;
  last_os: string | null;
  last_seen_at: string | null;
  pwa_install_status: string;
  pwa_install_prompt_viewed_at: string | null;
  pwa_install_clicked_at: string | null;
  pwa_installed_at: string | null;
  pwa_first_standalone_open_at: string | null;
  pwa_install_decline_count: number;
  pwa_install_last_declined_at: string | null;
  notification_permission: string;
  notification_prompt_viewed_at: string | null;
  notification_permission_requested_at: string | null;
  notification_permission_granted_at: string | null;
  notification_permission_denied_at: string | null;
  push_subscription_id: string | null;
  push_subscription_created_at: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
  onboarding_step: string;
  owner_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AcquisitionSessionRow = {
  id: string;
  lead_id: string;
  user_id: string | null;
  visitor_id: string;
  entry_page: string | null;
  previous_page: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AttributionDataRow = {
  id: string;
  lead_id: string;
  user_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  gclid: string | null;
  ttclid: string | null;
  touch_type: "first" | "last";
  created_at: string;
}

export type TrackingEventRow = {
  id: string;
  lead_id: string | null;
  user_id: string | null;
  event_name: string;
  properties: Record<string, unknown>;
  source: "client" | "server";
  created_at: string;
}

export type AffiliateConfigurationRow = {
  id: string;
  name: string;
  domain: string;
  registration_url: string;
  subid_parameter: string;
  logo_url: string | null;
  status: string;
  webhook_key: string;
  webhook_secret: string;
  accepted_events: string[];
  release_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type AffiliateClickRow = {
  id: string;
  user_id: string | null;
  lead_id: string;
  affiliate_configuration_id: string | null;
  generated_url: string;
  clicked_at: string;
}

export type AffiliateEventRow = {
  id: string;
  affiliate_configuration_id: string | null;
  user_id: string | null;
  lead_id: string | null;
  event_type: "registration" | "ftd";
  transaction_id: string;
  raw_payload: Record<string, unknown>;
  status: string;
  created_at: string;
}

export type RegistrationRow = {
  id: string;
  user_id: string;
  affiliate_configuration_id: string | null;
  affiliate_event_id: string | null;
  confirmed_at: string;
  created_at: string;
}

export type FtdRow = {
  id: string;
  user_id: string;
  affiliate_configuration_id: string | null;
  affiliate_event_id: string | null;
  confirmed_at: string;
  created_at: string;
}

export type EntitlementRow = {
  id: string;
  access_level: AccessLevel;
  feature_key: string;
  enabled: boolean;
  created_at: string;
}

export type CrmTimelineEventRow = {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export type CrmUserStatusRow = {
  user_id: string;
  pipeline_id: string | null;
  stage_id: string | null;
  responsible_admin_id: string | null;
  moved_at: string;
}

export type CommunityRoomRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  min_access_level: AccessLevel;
  position: number;
  is_active: boolean;
  created_at: string;
}

export type CommunityMemberRow = {
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export type CommunityMessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  parent_message_id: string | null;
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
}

export type AnalysisRow = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  match_id: string | null;
  league_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  market: string | null;
  odds_at_publish: number | null;
  risk_level: string | null;
  responsible_admin_id: string | null;
  image_url: string | null;
  tags: string[];
  audience: string;
  min_access_level: AccessLevel;
  status: string;
  publish_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MatchRow = {
  id: string;
  provider: string;
  provider_match_id: string;
  league_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  kickoff_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamRow = {
  id: string;
  provider: string;
  provider_team_id: string;
  name: string;
  logo_url: string | null;
  country: string | null;
  created_at: string;
}

export type LeagueRow = {
  id: string;
  provider: string;
  provider_league_id: string;
  name: string;
  country: string | null;
  logo_url: string | null;
  created_at: string;
}

export type SportsApiCacheRow = {
  id: string;
  cache_key: string;
  payload: unknown;
  expires_at: string;
  created_at: string;
}

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  fcm_token: string;
  device: string | null;
  browser: string | null;
  status: string;
  created_at: string;
}

export type ConsentRow = {
  id: string;
  user_id: string;
  consent_type: "terms" | "privacy" | "marketing";
  granted: boolean;
  version: string | null;
  granted_at: string;
  ip_address: string | null;
}

export type SystemSettingRow = {
  key: string;
  value: unknown;
  updated_at: string;
}

export type AutomationRunRow = {
  id: string;
  automation_key: string;
  user_id: string | null;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_type: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type AnalysisViewRow = {
  id: string;
  analysis_id: string;
  user_id: string | null;
  source: string | null;
  read_seconds: number | null;
  viewed_at: string;
}

export type ModerationActionRow = {
  id: string;
  target_user_id: string | null;
  message_id: string | null;
  action_type: string;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export type SportsApiLogRow = {
  id: string;
  endpoint: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export type AffiliateWebhookLogRow = {
  id: string;
  affiliate_configuration_id: string | null;
  status_code: number | null;
  request_headers: Record<string, unknown> | null;
  request_body: unknown;
  validation_result: string | null;
  error_message: string | null;
  created_at: string;
}

export type TrackingDeliveryLogRow = {
  id: string;
  tracking_event_id: string | null;
  destination: string;
  status: string;
  response_payload: unknown;
  error_message: string | null;
  attempted_at: string;
}

export type RoleRow = {
  id: string;
  name: string;
  admin_profile: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type CrmSegmentRow = {
  id: string;
  name: string;
  description: string | null;
  definition: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ScoreRuleRow = {
  key: string;
  dimension: string;
  points: number;
  description: string;
}

export type UserScoreRow = {
  user_id: string;
  intent_score: number;
  engagement_score: number;
  relationship_score: number;
  total_score: number;
  risk_blocked: boolean;
  risk_reason: string | null;
  calculated_at: string;
}

export type AllowedCompetitionRow = {
  id: string;
  provider: string;
  provider_competition_id: string;
  canonical_name: string;
  display_name: string | null;
  provider_name: string;
  country_name: string | null;
  competition_type: "league" | "cup" | "national_team" | "unknown";
  gender: "male" | "female" | "unknown";
  priority: number;
  logo_url: string | null;
  is_active: boolean;
  show_on_home: boolean;
  show_live: boolean;
  show_upcoming: boolean;
  notifications_enabled: boolean;
  requires_manual_review: boolean;
  blocked_reason: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Every table uses `Partial<Row>` as both Insert and Update. This is
 * intentionally permissive (it won't catch a forgotten required column at
 * compile time) in exchange for not fighting Omit/Pick gymnastics in a
 * hand-maintained file — swap for `supabase gen types typescript` output
 * once a live project exists, which generates precise Insert/Update types
 * per column default/nullability.
 */
export type Database = {
  public: {
    Tables: {
      users: TableDef<UserRow, Partial<UserRow>>;
      user_profiles: TableDef<UserProfileRow, Partial<UserProfileRow>>;
      user_preferences: TableDef<
        { user_id: string; dark_mode: boolean; language: string; updated_at: string },
        Partial<{ user_id: string; dark_mode: boolean; language: string; updated_at: string }>
      >;
      user_presence: TableDef<
        {
          user_id: string;
          status: "online" | "away" | "offline";
          current_page: string | null;
          last_activity_at: string;
          session_started_at: string | null;
          device: string | null;
        },
        Partial<{
          user_id: string;
          status: "online" | "away" | "offline";
          current_page: string | null;
          last_activity_at: string;
          session_started_at: string | null;
          device: string | null;
        }>
      >;
      acquisition_sessions: TableDef<AcquisitionSessionRow, Partial<AcquisitionSessionRow>>;
      attribution_data: TableDef<AttributionDataRow, Partial<AttributionDataRow>>;
      tracking_events: TableDef<TrackingEventRow, Partial<TrackingEventRow>>;
      tracking_delivery_logs: TableDef<TrackingDeliveryLogRow, Partial<TrackingDeliveryLogRow>>;
      affiliate_configurations: TableDef<AffiliateConfigurationRow, Partial<AffiliateConfigurationRow>>;
      affiliate_clicks: TableDef<AffiliateClickRow, Partial<AffiliateClickRow>>;
      affiliate_events: TableDef<AffiliateEventRow, Partial<AffiliateEventRow>>;
      affiliate_webhook_logs: TableDef<AffiliateWebhookLogRow, Partial<AffiliateWebhookLogRow>>;
      registrations: TableDef<RegistrationRow, Partial<RegistrationRow>>;
      ftds: TableDef<FtdRow, Partial<FtdRow>>;
      entitlements: TableDef<EntitlementRow, Partial<EntitlementRow>>;
      crm_timeline_events: TableDef<CrmTimelineEventRow, Partial<CrmTimelineEventRow>>;
      crm_user_status: TableDef<CrmUserStatusRow, Partial<CrmUserStatusRow>>;
      crm_stages: TableDef<
        { id: string; pipeline_id: string; name: string; position: number; created_at: string },
        Partial<{ id: string; pipeline_id: string; name: string; position: number; created_at: string }>
      >;
      crm_pipelines: TableDef<
        { id: string; name: string; is_default: boolean; created_at: string },
        Partial<{ id: string; name: string; is_default: boolean; created_at: string }>
      >;
      crm_notes: TableDef<
        { id: string; user_id: string; author_admin_id: string | null; note: string; created_at: string },
        Partial<{ id: string; user_id: string; author_admin_id: string | null; note: string; created_at: string }>
      >;
      crm_tasks: TableDef<
        {
          id: string;
          user_id: string;
          assigned_admin_id: string | null;
          title: string;
          due_at: string | null;
          status: string;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          assigned_admin_id: string | null;
          title: string;
          due_at: string | null;
          status: string;
          created_at: string;
        }>
      >;
      crm_tags: TableDef<
        { id: string; name: string; color: string | null },
        Partial<{ id: string; name: string; color: string | null }>
      >;
      crm_user_tags: TableDef<
        { user_id: string; tag_id: string },
        Partial<{ user_id: string; tag_id: string }>
      >;
      community_rooms: TableDef<CommunityRoomRow, Partial<CommunityRoomRow>>;
      community_members: TableDef<CommunityMemberRow, Partial<CommunityMemberRow>>;
      community_messages: TableDef<CommunityMessageRow, Partial<CommunityMessageRow>>;
      message_reactions: TableDef<
        { id: string; message_id: string; user_id: string; reaction: string; created_at: string },
        Partial<{ id: string; message_id: string; user_id: string; reaction: string; created_at: string }>
      >;
      message_reports: TableDef<
        {
          id: string;
          message_id: string;
          reported_by: string;
          reason: string | null;
          status: string;
          created_at: string;
        },
        Partial<{
          id: string;
          message_id: string;
          reported_by: string;
          reason: string | null;
          status: string;
          created_at: string;
        }>
      >;
      moderation_actions: TableDef<ModerationActionRow, Partial<ModerationActionRow>>;
      analyses: TableDef<AnalysisRow, Partial<AnalysisRow>>;
      analysis_views: TableDef<AnalysisViewRow, Partial<AnalysisViewRow>>;
      analysis_reactions: TableDef<
        { id: string; analysis_id: string; user_id: string; reaction: string; created_at: string },
        Partial<{ id: string; analysis_id: string; user_id: string; reaction: string; created_at: string }>
      >;
      matches: TableDef<MatchRow, Partial<MatchRow>>;
      match_events: TableDef<
        {
          id: string;
          match_id: string;
          minute: number | null;
          event_type: string;
          team_id: string | null;
          player_name: string | null;
          detail: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          match_id: string;
          minute: number | null;
          event_type: string;
          team_id: string | null;
          player_name: string | null;
          detail: string | null;
          created_at: string;
        }>
      >;
      standings: TableDef<
        {
          id: string;
          league_id: string;
          team_id: string;
          position: number | null;
          played: number | null;
          wins: number | null;
          draws: number | null;
          losses: number | null;
          goals_for: number | null;
          goals_against: number | null;
          points: number | null;
          updated_at: string;
        },
        Partial<{
          id: string;
          league_id: string;
          team_id: string;
          position: number | null;
          played: number | null;
          wins: number | null;
          draws: number | null;
          losses: number | null;
          goals_for: number | null;
          goals_against: number | null;
          points: number | null;
          updated_at: string;
        }>
      >;
      teams: TableDef<TeamRow, Partial<TeamRow>>;
      leagues: TableDef<LeagueRow, Partial<LeagueRow>>;
      sports_api_cache: TableDef<SportsApiCacheRow, Partial<SportsApiCacheRow>>;
      sports_api_logs: TableDef<SportsApiLogRow, Partial<SportsApiLogRow>>;
      push_subscriptions: TableDef<PushSubscriptionRow, Partial<PushSubscriptionRow>>;
      push_campaigns: TableDef<
        {
          id: string;
          internal_name: string;
          category: string;
          segment_id: string | null;
          title: string;
          message: string;
          image_url: string | null;
          internal_link: string | null;
          scheduled_at: string | null;
          status: string;
          ab_test: boolean;
          frequency_cap: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          internal_name: string;
          category: string;
          segment_id: string | null;
          title: string;
          message: string;
          image_url: string | null;
          internal_link: string | null;
          scheduled_at: string | null;
          status: string;
          ab_test: boolean;
          frequency_cap: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      push_deliveries: TableDef<
        {
          id: string;
          push_campaign_id: string | null;
          user_id: string | null;
          status: string;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          failure_reason: string | null;
        },
        Partial<{
          id: string;
          push_campaign_id: string | null;
          user_id: string | null;
          status: string;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          failure_reason: string | null;
        }>
      >;
      consents: TableDef<ConsentRow, Partial<ConsentRow>>;
      marketing_optouts: TableDef<
        { id: string; user_id: string; opted_out_at: string; reason: string | null },
        Partial<{ id: string; user_id: string; opted_out_at: string; reason: string | null }>
      >;
      banned_words: TableDef<
        { id: string; word: string; created_at: string },
        Partial<{ id: string; word: string; created_at: string }>
      >;
      automation_runs: TableDef<AutomationRunRow, Partial<AutomationRunRow>>;
      audit_logs: TableDef<AuditLogRow, Partial<AuditLogRow>>;
      system_settings: TableDef<SystemSettingRow, Partial<SystemSettingRow>>;
      roles: TableDef<RoleRow, Partial<RoleRow>>;
      user_roles: TableDef<
        { user_id: string; role_id: string; assigned_at: string },
        Partial<{ user_id: string; role_id: string; assigned_at: string }>
      >;
      crm_segments: TableDef<CrmSegmentRow, Partial<CrmSegmentRow>>;
      score_rules: TableDef<ScoreRuleRow, Partial<ScoreRuleRow>>;
      user_scores: TableDef<UserScoreRow, Partial<UserScoreRow>>;
      allowed_competitions: TableDef<AllowedCompetitionRow, Partial<AllowedCompetitionRow>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
