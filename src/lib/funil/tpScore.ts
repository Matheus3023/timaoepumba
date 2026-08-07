/**
 * T&P SCORE (PRD secs. 24 e 25).
 *
 * IMPORTANTE, e vale repetir porque é o erro mais fácil de cometer aqui:
 * isto NÃO é probabilidade de acerto. É uma nota de força do sinal, e ela
 * é calculada DEPOIS e SEPARADAMENTE das regras do Funil. Um score alto
 * nunca transforma um jogo que reprovou um critério obrigatório em "Funil
 * Validado" — quem decide isso é `evaluateStrategy`, e ele não olha para
 * este arquivo.
 *
 * Os pesos ficam num objeto único para poderem virar configuração de painel
 * mais adiante sem espalhar números mágicos pelo código.
 */
import type {
  DataQuality,
  FunilMetrics,
  RuleStatus,
  StrategyParams,
  TpMomentum,
  TpScoreClass,
  TpScoreResult,
} from "@/lib/funil/types";

export interface TpScoreWeights {
  appm: number;
  cg: number;
  pressure: number;
  scoreContext: number;
  odd: number;
  dataQuality: number;
  /** Desconto por partida com expulsão (PRD sec. 44). */
  redCardPenalty: number;
}

export const DEFAULT_TP_SCORE_WEIGHTS: TpScoreWeights = {
  appm: 25,
  cg: 25,
  pressure: 20,
  scoreContext: 10,
  odd: 10,
  dataQuality: 10,
  redCardPenalty: 10,
};

/**
 * Pontua "quanto acima do mínimo" um valor está.
 *
 * Bater exatamente o mínimo já vale 60% dos pontos; 50% acima do mínimo
 * chega ao teto. Abaixo do mínimo a pontuação cai proporcionalmente — o
 * critério em si já terá reprovado nas regras, aqui só refletimos o quão
 * longe ficou.
 */
function distanceScore(value: number | null, threshold: number | null | undefined, max: number): number {
  if (value === null || threshold === null || threshold === undefined || threshold <= 0) return 0;
  const ratio = value / threshold;
  if (ratio <= 0) return 0;
  if (ratio < 1) return max * 0.6 * ratio;
  return Math.min(max, max * (0.6 + 0.4 * Math.min((ratio - 1) / 0.5, 1)));
}

/**
 * Pressão recente: compara o ritmo dos últimos minutos com o ritmo médio da
 * partida inteira. É esse contraste que separa "pressionou o jogo todo" de
 * "está pressionando agora", que é o ponto da sec. 23.
 */
function pressureScore(
  momentum: TpMomentum | null,
  liveMinute: number | null,
  totalDangerousAttacks: number | null,
  max: number
): number {
  if (!momentum || liveMinute === null || liveMinute <= 0) return 0;
  if (totalDangerousAttacks === null || totalDangerousAttacks <= 0) return 0;

  const matchRate = totalDangerousAttacks / liveMinute;
  if (matchRate <= 0) return 0;

  const windowScore = (delta: number | null, minutes: number, weight: number): number => {
    if (delta === null) return 0;
    const rate = delta / minutes;
    // Ritmo igual à média vale metade; o dobro da média satura.
    return weight * Math.min(rate / matchRate, 2) * 0.5;
  };

  return Math.min(
    max,
    windowScore(momentum.dangerous_attacks_last_5m, 5, max * 0.6) +
      windowScore(momentum.dangerous_attacks_last_10m, 10, max * 0.4)
  );
}

function qualityScore(quality: DataQuality, max: number): number {
  if (quality === "HIGH") return max;
  if (quality === "MEDIUM") return max * 0.5;
  return 0;
}

export function classifyTpScore(score: number): TpScoreClass {
  if (score >= 85) return "MUITO_FORTE";
  if (score >= 70) return "FORTE";
  if (score >= 50) return "EM_OBSERVACAO";
  return "FRACO";
}

export const TP_SCORE_CLASS_LABEL: Record<TpScoreClass, string> = {
  FRACO: "FRACO",
  EM_OBSERVACAO: "EM OBSERVAÇÃO",
  FORTE: "FORTE",
  MUITO_FORTE: "MUITO FORTE",
};

export interface TpScoreInput {
  metrics: FunilMetrics;
  params: StrategyParams;
  momentum: TpMomentum | null;
  liveMinute: number | null;
  totalDangerousAttacks: number | null;
  scoreContextStatus: RuleStatus | null;
  oddStatus: RuleStatus | null;
  dataQuality: DataQuality;
  /** Gol FT pontua pelo CG somado; as demais, pelo CG do dominante. */
  cgBasis: "dominant" | "total";
  weights?: TpScoreWeights;
}

export function calculateTPScore(input: TpScoreInput): TpScoreResult {
  const weights = input.weights ?? DEFAULT_TP_SCORE_WEIGHTS;
  const { metrics, params } = input;

  const cgValue = input.cgBasis === "total" ? (metrics.cgAdjusted ?? metrics.cgTotal) : metrics.cgDominant;
  const cgThreshold = input.cgBasis === "total" ? params.min_cg_total : params.min_cg_dominant;

  const breakdown: TpScoreResult["breakdown"] = [
    {
      key: "appm",
      label: "APPM acima do mínimo",
      points: distanceScore(metrics.dominantAppm, params.min_appm, weights.appm),
      max: weights.appm,
    },
    {
      key: "cg",
      label: "CG acima do mínimo",
      points: distanceScore(cgValue, cgThreshold, weights.cg),
      max: weights.cg,
    },
    {
      key: "pressure",
      label: input.momentum ? "Pressão nos últimos minutos" : "Pressão recente (sem histórico)",
      points: pressureScore(input.momentum, input.liveMinute, input.totalDangerousAttacks, weights.pressure),
      max: weights.pressure,
    },
    {
      key: "score_context",
      label: "Contexto de placar",
      points: input.scoreContextStatus === "pass" ? weights.scoreContext : 0,
      max: weights.scoreContext,
    },
    {
      key: "odd",
      // Sem fonte de odds ao vivo nesta API, este bloco fica zerado para
      // todo mundo — é uma perda honesta de certeza, não um bug.
      label: input.oddStatus === "not_evaluated" ? "Odd (sem fonte de mercado)" : "Odd de referência",
      points: input.oddStatus === "pass" ? weights.odd : 0,
      max: weights.odd,
    },
    {
      key: "data_quality",
      label: "Qualidade e frescor dos dados",
      points: qualityScore(input.dataQuality, weights.dataQuality),
      max: weights.dataQuality,
    },
  ];

  if (metrics.redCardContext) {
    breakdown.push({
      key: "red_card",
      label: "Partida com expulsão — dinâmica alterada",
      points: -weights.redCardPenalty,
      max: 0,
    });
  }

  const raw = breakdown.reduce((total, item) => total + item.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    classification: classifyTpScore(score),
    breakdown: breakdown.map((item) => ({ ...item, points: Math.round(item.points * 10) / 10 })),
  };
}
