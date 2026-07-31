export type SegmentConditionType =
  | "access_level_equals"
  | "access_level_at_least"
  | "pwa_installed"
  | "pwa_not_installed"
  | "push_authorized"
  | "push_not_authorized"
  | "installed_no_push"
  | "onboarding_incomplete"
  | "never_opened_app"
  | "active_within_days"
  | "inactive_days_at_least"
  | "community_member"
  | "community_messages_at_least"
  | "marketing_opted_out"
  | "restricted"
  | "affiliate_clicked_no_registration"
  | "registration_no_ftd"
  | "ftd_confirmed"
  | "postback_failed"
  | "favorited_team"
  | "match_views_at_least"
  | "no_push_received_last_hours";

export interface SegmentCondition {
  type: SegmentConditionType;
  value?: string | number;
}

/**
 * Condition registry for the segment builder (PRD sec. 12). Deliberately a
 * flat AND-of-conditions rather than the full nested AND/OR/NOT group
 * builder from PRD sec. 12.3 — covers the "segmentos obrigatorios" list
 * (sec. 12.4) almost entirely with a much simpler admin UI; nested
 * groups can be layered on top of this same `definition` jsonb column
 * later without a schema change.
 *
 * Not covered yet (no underlying data source exists): usuario online
 * (user_presence isn't populated by anything), usuario com possivel
 * duplicidade (no dedup queue built), usuario com atendimento aberto (no
 * support desk built).
 */
export const CONDITION_LABEL: Record<SegmentConditionType, string> = {
  access_level_equals: "Nivel de acesso e exatamente",
  access_level_at_least: "Nivel de acesso e pelo menos",
  pwa_installed: "Instalou o aplicativo",
  pwa_not_installed: "Nao instalou o aplicativo",
  push_authorized: "Push autorizado",
  push_not_authorized: "Push nao autorizado",
  installed_no_push: "Instalou mas nao autorizou push",
  onboarding_incomplete: "Onboarding nao concluido",
  never_opened_app: "Nunca abriu o aplicativo",
  active_within_days: "Ativo nos ultimos N dias",
  inactive_days_at_least: "Inativo ha pelo menos N dias",
  community_member: "Membro de alguma sala da comunidade",
  community_messages_at_least: "Enviou pelo menos N mensagens na comunidade",
  marketing_opted_out: "Fez opt-out de marketing",
  restricted: "Usuario restrito",
  affiliate_clicked_no_registration: "Clicou na casa mas nao confirmou cadastro",
  registration_no_ftd: "Cadastro confirmado sem FTD",
  ftd_confirmed: "FTD confirmado",
  postback_failed: "Teve postback rejeitado",
  favorited_team: "Favoritou um time",
  match_views_at_least: "Visualizou pelo menos N partidas",
  no_push_received_last_hours: "Nao recebeu push nas ultimas N horas",
};

export const CONDITION_VALUE_KIND: Partial<Record<SegmentConditionType, "access_level" | "number">> = {
  access_level_equals: "access_level",
  access_level_at_least: "access_level",
  active_within_days: "number",
  inactive_days_at_least: "number",
  community_messages_at_least: "number",
  match_views_at_least: "number",
  no_push_received_last_hours: "number",
};
