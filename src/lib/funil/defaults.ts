/**
 * Parâmetros iniciais das seis estratégias (PRD sec. 51).
 *
 * Estes valores são apenas a SEMENTE: em produção quem manda é a linha de
 * `strategy_configs`. Mexer aqui não muda nada num ambiente que já rodou o
 * seed — mudança de regra passa pelo painel e gera nova `version`
 * (PRD sec. 38), justamente para dar para descobrir depois qual versão
 * performou melhor.
 *
 * As janelas de minuto do Gol FT são adaptação operacional do Timão e
 * Pumba, não regra imutável do método (PRD sec. 10).
 */
import { DEFAULT_SCORE_CONTEXTS } from "@/lib/funil/scoreContext";
import type { StrategyConfig, StrategyGroup, StrategyId } from "@/lib/funil/types";

export const STRATEGY_IDS: StrategyId[] = [
  "FUNIL_GOAL_HT",
  "FUNIL_GOAL_FT",
  "FUNIL_CORNER_HT_LIMIT",
  "FUNIL_CORNER_HT_ASIAN",
  "FUNIL_CORNER_FT_LIMIT",
  "FUNIL_CORNER_FT_ASIAN",
];

export const STRATEGY_GROUP: Record<StrategyId, StrategyGroup> = {
  FUNIL_GOAL_HT: "GOAL_HT",
  FUNIL_GOAL_FT: "GOAL_FT",
  FUNIL_CORNER_HT_LIMIT: "CORNER_HT",
  FUNIL_CORNER_HT_ASIAN: "CORNER_HT",
  FUNIL_CORNER_FT_LIMIT: "CORNER_FT",
  FUNIL_CORNER_FT_ASIAN: "CORNER_FT",
};

/** Nomenclatura T&P exibida ao usuário (PRD sec. 50). */
export const STRATEGY_LABEL: Record<StrategyId, string> = {
  FUNIL_GOAL_HT: "FUNIL GOL HT",
  FUNIL_GOAL_FT: "FUNIL GOL FT",
  FUNIL_CORNER_HT_LIMIT: "FUNIL CANTOS HT — LIMITE",
  FUNIL_CORNER_HT_ASIAN: "FUNIL CANTOS HT — ASIÁTICO",
  FUNIL_CORNER_FT_LIMIT: "FUNIL CANTOS FT — LIMITE",
  FUNIL_CORNER_FT_ASIAN: "FUNIL CANTOS FT — ASIÁTICO",
};

export const STRATEGY_GROUP_LABEL: Record<StrategyGroup, string> = {
  GOAL_HT: "GOL HT",
  GOAL_FT: "GOL FT",
  CORNER_HT: "CANTOS HT",
  CORNER_FT: "CANTOS FT",
};

export const INITIAL_STRATEGY_VERSION = "1.0";

/** Cooldown de alerta repetido (PRD sec. 28). */
export const DEFAULT_COOLDOWN_SECONDS = 180;

/**
 * Todas nascem em shadow mode (PRD sec. 53): o motor grava tudo, e nada
 * chega ao usuário nem vira push até alguém liberar no painel.
 */
export const DEFAULT_STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    strategyId: "FUNIL_GOAL_HT",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 30,
      max_minute: 45,
      min_appm: 1.3,
      min_cg_dominant: 10,
      min_bo: 6,
      min_rm: 100,
      min_odd: 2.0,
      pre_signal_lead_minutes: 5,
    },
  },
  {
    strategyId: "FUNIL_GOAL_FT",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 55,
      max_minute: 85,
      min_appm: 1.0,
      min_cg_total: 30,
      min_shots_on_target_total: 10,
      min_odd: 1.6,
      pre_signal_lead_minutes: 5,
    },
  },
  {
    strategyId: "FUNIL_CORNER_HT_LIMIT",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 37,
      max_minute: 42,
      min_appm: 1.0,
      min_cg_dominant: 15,
      min_odd: 1.7,
      score_contexts: DEFAULT_SCORE_CONTEXTS,
      pre_signal_lead_minutes: 5,
      line_offset: 0.5,
    },
  },
  {
    strategyId: "FUNIL_CORNER_HT_ASIAN",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 38,
      max_minute: 45,
      min_appm: 1.0,
      min_cg_dominant: 15,
      min_odd: null,
      score_contexts: DEFAULT_SCORE_CONTEXTS,
      pre_signal_lead_minutes: 5,
      line_offset: 1.0,
    },
  },
  {
    strategyId: "FUNIL_CORNER_FT_LIMIT",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 86,
      max_minute: 89,
      min_appm: 1.0,
      min_cg_dominant: 15,
      min_odd: 1.7,
      score_contexts: DEFAULT_SCORE_CONTEXTS,
      pre_signal_lead_minutes: 4,
      line_offset: 0.5,
    },
  },
  {
    strategyId: "FUNIL_CORNER_FT_ASIAN",
    version: INITIAL_STRATEGY_VERSION,
    enabled: true,
    shadowMode: true,
    notificationEnabled: false,
    preSignalEnabled: true,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
    params: {
      min_minute: 83,
      max_minute: 90,
      min_appm: 1.0,
      min_cg_dominant: 15,
      min_odd: null,
      score_contexts: DEFAULT_SCORE_CONTEXTS,
      pre_signal_lead_minutes: 4,
      line_offset: 1.0,
    },
  },
];

export function defaultConfigFor(strategyId: StrategyId): StrategyConfig {
  const config = DEFAULT_STRATEGY_CONFIGS.find((c) => c.strategyId === strategyId);
  if (!config) throw new Error(`defaultConfigFor: estrategia desconhecida ${strategyId}`);
  return config;
}

/**
 * Menor e maior minuto em que qualquer estratégia tem algo a fazer,
 * considerando o pré-sinal. O coletor usa isso para não gastar chamada de
 * API com jogo fora de qualquer janela (PRD sec. 55).
 */
export function globalMonitoringWindow(configs: StrategyConfig[] = DEFAULT_STRATEGY_CONFIGS): {
  min: number;
  max: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (const config of configs) {
    if (!config.enabled) continue;
    min = Math.min(min, config.params.min_minute - (config.params.pre_signal_lead_minutes ?? 0));
    max = Math.max(max, config.params.max_minute);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 90 };
  return { min: Math.max(0, min), max };
}
