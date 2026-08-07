/**
 * Formatação e composição dos chips do card (PRD sec. 30).
 *
 * Fica aqui, e não dentro do componente, porque continua sendo regra: quais
 * números aparecem depende da estratégia, e o PRD lista explicitamente
 * conjuntos diferentes para gol e para escanteio. Componente de interface
 * não decide isso (sec. 42).
 *
 * Módulo puro — pode ser importado por Server e por Client Component.
 */
import { STRATEGY_GROUP } from "@/lib/funil/defaults";
import type { FunilMetrics, SignalState, StrategyId, TpMomentum } from "@/lib/funil/types";

/** As métricas gravadas no sinal carregam o momentum junto (ver tick.ts). */
export type StoredMetrics = Partial<FunilMetrics> & { momentum?: TpMomentum | null };

export const SIGNAL_STATE_LABEL: Record<SignalState, string> = {
  MONITORING: "MONITORANDO",
  PRE_SIGNAL: "PRÉ-SINAL",
  VALIDATED: "FUNIL VALIDADO",
  ENTRY_AVAILABLE: "ENTRADA DISPONÍVEL",
  FINISHED: "FINALIZADO",
  EXPIRED: "EXPIRADO",
  REJECTED: "REJEITADO",
  DATA_INCOMPLETE: "DADOS INSUFICIENTES",
  UNSUPPORTED_LIVE_STATS: "SEM ESTATÍSTICA AO VIVO",
};

/** Uma casa decimal só quando o número pede; inteiro fica inteiro. */
export function formatMetric(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

export interface Chip {
  label: string;
  value: string;
  /** `null` quando não há dado — o chip aparece neutro, sem ✅ nem ❌. */
  ok: boolean | null;
}

/**
 * Monta os chips do card conforme o grupo da estratégia, exatamente como o
 * PRD sec. 30 pede. `ruleStatus` vem de `rule_results` para o ✅/❌ refletir
 * o que o motor decidiu, e não uma segunda comparação feita aqui — dois
 * lugares comparando o mesmo limiar acabariam divergindo.
 */
export function buildChips(
  strategyId: StrategyId,
  metrics: StoredMetrics,
  ruleStatus: Record<string, boolean | null>
): Chip[] {
  const group = STRATEGY_GROUP[strategyId];
  const momentum = metrics.momentum ?? null;

  const appm: Chip = { label: "APPM", value: formatMetric(metrics.dominantAppm), ok: ruleStatus.appm ?? null };

  if (group === "GOAL_HT") {
    return [
      appm,
      { label: "CG", value: formatMetric(metrics.cgDominant), ok: ruleStatus.cg ?? null },
      { label: "RM", value: formatMetric(metrics.rm, 1), ok: ruleStatus.rm ?? null },
      { label: "BO", value: formatMetric(metrics.bo), ok: ruleStatus.bo ?? null },
    ];
  }

  if (group === "GOAL_FT") {
    return [
      appm,
      {
        label: "CG total",
        value: formatMetric(metrics.cgAdjusted ?? metrics.cgTotal),
        ok: ruleStatus.cg ?? null,
      },
      {
        label: "Chutes no alvo",
        value: formatMetric(metrics.shotsOnTargetTotal),
        ok: ruleStatus.shots_on_target ?? null,
      },
      {
        label: "Pressão 5m",
        value: momentum?.dangerous_attacks_last_5m === null || momentum?.dangerous_attacks_last_5m === undefined
          ? "—"
          : `${momentum.dangerous_attacks_last_5m} AP`,
        ok: null,
      },
    ];
  }

  // Escanteios (HT e FT).
  return [
    appm,
    { label: "CG", value: formatMetric(metrics.cgDominant), ok: ruleStatus.cg ?? null },
    { label: "Cantos", value: formatMetric(metrics.cornersTotal), ok: null },
    {
      label: "Último canto",
      value:
        momentum?.time_since_last_corner === null || momentum?.time_since_last_corner === undefined
          ? "—"
          : `há ${momentum.time_since_last_corner}'`,
      ok: null,
    },
    {
      label: "Pressão 5m",
      value:
        momentum?.dangerous_attacks_last_5m === null || momentum?.dangerous_attacks_last_5m === undefined
          ? "—"
          : `${momentum.dangerous_attacks_last_5m} AP`,
      ok: null,
    },
  ];
}

/** Ícone do grupo, usado no topo do card e nas abas. */
export const GROUP_ICON: Record<string, string> = {
  GOAL_HT: "⚽",
  GOAL_FT: "⚽",
  CORNER_HT: "🚩",
  CORNER_FT: "🚩",
};

/** "Atualizado há Xs" (PRD sec. 56). */
export function formatAge(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `há ${minutes} min`;
}
