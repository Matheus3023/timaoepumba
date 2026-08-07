/**
 * MOTOR FUNIL T&P — tipos centrais.
 *
 * Regra que atravessa este arquivo inteiro (PRD sec. 3): todo campo
 * estatístico é `number | null`. `0` significa "sabemos que não aconteceu";
 * `null` significa "não temos o dado". Nada aqui pode transformar um no
 * outro, porque é essa diferença que impede o motor de emitir um sinal em
 * cima de dado ausente.
 *
 * Nada neste módulo importa React, Next ou Supabase: o motor precisa rodar
 * igual com uma partida ao vivo ou com um snapshot histórico (PRD sec. 40/42).
 */

export type TeamSide = "home" | "away";

/** Estatísticas ao vivo já normalizadas para o padrão interno (PRD sec. 2). */
export interface LiveStats {
  dangerous_attacks_home: number | null;
  dangerous_attacks_away: number | null;
  attacks_home: number | null;
  attacks_away: number | null;
  possession_home: number | null;
  possession_away: number | null;
  shots_on_target_home: number | null;
  shots_on_target_away: number | null;
  shots_off_target_home: number | null;
  shots_off_target_away: number | null;
  shots_total_home: number | null;
  shots_total_away: number | null;
  corners_home: number | null;
  corners_away: number | null;
  red_cards_home: number | null;
  red_cards_away: number | null;
}

export const EMPTY_LIVE_STATS: LiveStats = {
  dangerous_attacks_home: null,
  dangerous_attacks_away: null,
  attacks_home: null,
  attacks_away: null,
  possession_home: null,
  possession_away: null,
  shots_on_target_home: null,
  shots_on_target_away: null,
  shots_off_target_home: null,
  shots_off_target_away: null,
  shots_total_home: null,
  shots_total_away: null,
  corners_home: null,
  corners_away: null,
  red_cards_home: null,
  red_cards_away: null,
};

/**
 * Período da partida (PRD sec. 45–48). É mais importante que o minuto cru:
 * 45+3 continua sendo primeiro tempo, e prorrogação/pênaltis ficam fora do
 * motor.
 */
export type MatchPeriod =
  | "PRE_MATCH"
  | "FIRST_HALF"
  | "HALFTIME"
  | "SECOND_HALF"
  | "EXTRA_TIME"
  | "PENALTIES"
  | "FINISHED"
  | "UNKNOWN";

export interface PeriodInfo {
  period: MatchPeriod;
  /** Minuto regulamentar (45+3 → 45). */
  liveMinute: number | null;
  /** Acréscimos separados do minuto regulamentar (45+3 → 3). */
  injuryTime: number | null;
  /**
   * "low" quando o período foi inferido em vez de lido. O provedor não
   * expõe período, então intervalo e afins são deduzidos — quem consome
   * precisa saber o quanto confiar.
   */
  confidence: "high" | "low";
}

/** Pressão recente — camada T&P, não faz parte das regras do Funil (PRD sec. 23). */
export interface TpMomentum {
  dangerous_attacks_last_5m: number | null;
  dangerous_attacks_last_10m: number | null;
  shots_last_5m: number | null;
  shots_last_10m: number | null;
  corners_last_5m: number | null;
  corners_last_10m: number | null;
  possession_recent: number | null;
  time_since_last_corner: number | null;
  time_since_last_shot: number | null;
}

export interface CornerObservation {
  minute: number;
  team: TeamSide | null;
}

export interface FixtureIdentity {
  fixtureId: string;
  leagueId: string;
  leagueName: string;
  country: string | null;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string | null;
}

export interface PreMatchOdds {
  home: number;
  draw: number;
  away: number;
}

/**
 * Fotografia completa de uma partida num instante. É a única entrada do
 * motor matemático — `evaluateStrategy(snapshot, config)` não conhece nem
 * a API nem o banco (PRD sec. 40/42).
 */
export interface FixtureSnapshot {
  fixture: FixtureIdentity;
  period: MatchPeriod;
  liveMinute: number | null;
  injuryTime: number | null;
  periodConfidence: "high" | "low";
  scoreHome: number | null;
  scoreAway: number | null;
  stats: LiveStats;
  preMatchOdds: PreMatchOdds | null;
  /** Sempre `null` com o provedor atual — ver `LiveMarket`. */
  market: LiveMarket | null;
  momentum: TpMomentum | null;
  /** Último escanteio observado, derivado do delta entre snapshots nossos. */
  lastCorner: CornerObservation | null;
  /** False quando não acompanhamos o jogo desde cedo — sem base p/ último canto. */
  cornerHistoryAvailable: boolean;
  collectedAt: string;
  /** Idade do dado do provedor em segundos (PRD sec. 2/43). */
  dataAgeSeconds: number | null;
  /**
   * Há quantos segundos as estatísticas estão IDÊNTICAS entre coletas.
   * Não confundir com `dataAgeSeconds`: o dado pode ter acabado de chegar
   * (idade 0) e ainda assim estar congelado do lado do provedor, que é um
   * problema diferente e igualmente impeditivo (PRD sec. 43).
   */
  statsFrozenForSeconds: number | null;
  provider: string;
}

/** Métricas derivadas do snapshot (PRD secs. 4–7, 11–13). */
export interface FunilMetrics {
  appmHome: number | null;
  appmAway: number | null;
  dominantTeam: TeamSide | null;
  dominantAppm: number | null;
  dominantPossession: number | null;
  cgHome: number | null;
  cgAway: number | null;
  cgTotal: number | null;
  cgDominant: number | null;
  /** CG total menos escanteios sequenciais; null quando não dá para ajustar. */
  cgAdjusted: number | null;
  sequentialCornerCount: number | null;
  shotsOnTargetTotal: number | null;
  cornersTotal: number | null;
  bo: number | null;
  rm: number | null;
  redCardContext: boolean;
}

export type DataQuality = "HIGH" | "MEDIUM" | "LOW";

export interface DataQualityReport {
  quality: DataQuality;
  /** Campos obrigatórios ausentes — se houver, nada pode virar VALIDATED. */
  missingRequired: string[];
  warnings: string[];
  /** True quando a competição não fornece as estatísticas base (PRD sec. 49). */
  unsupportedLiveStats: boolean;
  statsFresh: boolean;
}

export type RuleStatus =
  /** Critério avaliado e aprovado. */
  | "pass"
  /** Critério avaliado e reprovado. */
  | "fail"
  /** Não temos o dado — diferente de reprovado. */
  | "unavailable"
  /** Não se aplica agora (ex.: odd sem fonte de mercado). */
  | "not_evaluated";

export interface RuleResult {
  key: string;
  label: string;
  value: number | string | null;
  threshold: number | string | null;
  status: RuleStatus;
  detail?: string;
}

export type SignalState =
  | "MONITORING"
  | "PRE_SIGNAL"
  | "VALIDATED"
  | "ENTRY_AVAILABLE"
  | "FINISHED"
  | "EXPIRED"
  | "REJECTED"
  | "DATA_INCOMPLETE"
  | "UNSUPPORTED_LIVE_STATS";

/** Estados em que um sinal ainda está "vivo" para o usuário. */
export const ACTIVE_SIGNAL_STATES: SignalState[] = ["PRE_SIGNAL", "VALIDATED", "ENTRY_AVAILABLE"];

export type StrategyId =
  | "FUNIL_GOAL_HT"
  | "FUNIL_GOAL_FT"
  | "FUNIL_CORNER_HT_LIMIT"
  | "FUNIL_CORNER_HT_ASIAN"
  | "FUNIL_CORNER_FT_LIMIT"
  | "FUNIL_CORNER_FT_ASIAN";

export type StrategyGroup = "GOAL_HT" | "GOAL_FT" | "CORNER_HT" | "CORNER_FT";

export type EntryLineType = "limit" | "asian" | "binary";

export interface EntryLine {
  /** Mercado interno, ex.: "corners_ft", "goals_ht". */
  market: string;
  type: EntryLineType;
  /** Linha numérica; null para mercados binários como Over 0.5 gol HT. */
  line: number | null;
  /** Texto exibido no card, ex.: "OVER 9.5 CANTOS FT". */
  label: string;
}

export type ScoreContext = "DRAW_0_0" | "DRAW_1_1" | "ANY_DRAW" | "DOMINANT_LOSING_BY_1";

/**
 * Dados de mercado ao vivo (PRD sec. 2). A API atual do projeto não fornece
 * nenhum deles — o tipo existe para que a regra de odd já esteja escrita e
 * passe a funcionar sozinha no dia em que houver fonte, sem retrabalho.
 */
export interface LiveMarket {
  currentMarket: string;
  marketStatus: "open" | "closed" | "suspended" | "unknown";
  currentLine: number | null;
  currentOdd: number | null;
}

/** Parâmetros configuráveis por estratégia (PRD sec. 37). */
export interface StrategyParams {
  min_minute: number;
  max_minute: number;
  min_appm?: number;
  /** CG do time dominante (Gol HT e Cantos). */
  min_cg_dominant?: number;
  /** CG somado das duas equipes (Gol FT). */
  min_cg_total?: number;
  /** Comparado com ">" e não ">=" (PRD sec. 13). */
  min_shots_on_target_total?: number;
  min_bo?: number;
  min_rm?: number;
  /** Referência de odd; sem fonte de mercado o critério fica not_evaluated. */
  min_odd?: number | null;
  score_contexts?: ScoreContext[];
  /** Quantos minutos antes da janela o pré-sinal pode aparecer (PRD sec. 26). */
  pre_signal_lead_minutes?: number;
  /** Deslocamento da linha em relação ao total atual (0.5 limite, 1.0 asiático). */
  line_offset?: number;
  /**
   * Chaves de critério que devem BLOQUEAR a validação quando o dado estiver
   * ausente, em vez de apenas ficar sinalizado (ex.: ["bo", "rm"]).
   * Vazio por padrão porque o PRD sec. 8 valida com "todos os critérios
   * obrigatórios DISPONÍVEIS" e a sec. 6 manda sinalizar BO indisponível em
   * vez de rejeitar. Fica no painel para endurecer sem mexer em código.
   */
  block_on_unavailable?: string[];
}

export interface StrategyConfig {
  strategyId: StrategyId;
  version: string;
  enabled: boolean;
  shadowMode: boolean;
  notificationEnabled: boolean;
  preSignalEnabled: boolean;
  cooldownSeconds: number;
  params: StrategyParams;
}

export type TpScoreClass = "FRACO" | "EM_OBSERVACAO" | "FORTE" | "MUITO_FORTE";

export interface TpScoreResult {
  score: number;
  classification: TpScoreClass;
  breakdown: { key: string; label: string; points: number; max: number }[];
}

/**
 * Saída de `evaluateStrategy`. Repare que `state` nunca é ENTRY_AVAILABLE:
 * a promoção VALIDATED → ENTRY_AVAILABLE depende da odd e é decidida pela
 * máquina de estados, não pela avaliação estatística (PRD secs. 9 e 13).
 */
export interface StrategyEvaluation {
  strategyId: StrategyId;
  strategyVersion: string;
  group: StrategyGroup;
  state: Exclude<SignalState, "ENTRY_AVAILABLE" | "FINISHED">;
  period: MatchPeriod;
  minute: number | null;
  rules: RuleResult[];
  metrics: FunilMetrics;
  dataQuality: DataQualityReport;
  warnings: string[];
  entryLine: EntryLine | null;
  /**
   * true/false quando existe fonte de odds; `null` quando não existe —
   * e nesse caso a odd não pode bloquear o sinal (PRD sec. 9).
   */
  entryOddSatisfied: boolean | null;
  tpScore: TpScoreResult | null;
  reason: string | null;
}

export type SignalResultValue = "PENDING" | "GREEN" | "RED" | "PUSH" | "VOID";
