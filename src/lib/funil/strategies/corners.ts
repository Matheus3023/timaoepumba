/**
 * Base compartilhada das quatro estratégias de escanteio (PRD secs. 15 a 22).
 *
 * Os critérios estatísticos são os mesmos nas quatro — APPM do dominante,
 * CG do dominante e contexto de placar. O que muda é a janela de minuto (do
 * config) e o tipo de linha:
 *
 *  - LIMITE   → total atual + 0.5  → precisa de mais 1 escanteio
 *  - ASIÁTICO → total atual + 1.0  → 1 devolve (PUSH), 2+ ganha
 *
 * Os dois nunca se misturam: são sinais distintos, com resolução distinta.
 */
import { buildOddRule, compareRule, evaluateStrategy, type StrategyContext, type StrategyDefinition } from "@/lib/funil/strategies/common";
import { DEFAULT_SCORE_CONTEXTS, SCORE_CONTEXT_LABEL, isCornerScoreContextValid } from "@/lib/funil/scoreContext";
import type { EntryLine, MatchPeriod, RuleResult, StrategyId } from "@/lib/funil/types";

function scoreContextRule(context: StrategyContext): RuleResult {
  const contexts = context.config.params.score_contexts ?? DEFAULT_SCORE_CONTEXTS;
  const result = isCornerScoreContextValid(
    {
      scoreHome: context.snapshot.scoreHome,
      scoreAway: context.snapshot.scoreAway,
      dominantTeam: context.metrics.dominantTeam,
    },
    contexts
  );

  const scoreLabel =
    context.snapshot.scoreHome === null || context.snapshot.scoreAway === null
      ? null
      : `${context.snapshot.scoreHome} x ${context.snapshot.scoreAway}`;

  return {
    key: "score_context",
    label: "Contexto de placar",
    value: scoreLabel,
    threshold: contexts.map((c) => SCORE_CONTEXT_LABEL[c]).join(" ou "),
    status: result.status,
    detail: result.matched ? SCORE_CONTEXT_LABEL[result.matched] : undefined,
  };
}

function buildCornerRules(context: StrategyContext): RuleResult[] {
  const { metrics, config } = context;
  return [
    compareRule("appm", "APPM", metrics.dominantAppm, config.params.min_appm, "gte"),
    compareRule("cg", "CG", metrics.cgDominant, config.params.min_cg_dominant, "gte"),
    scoreContextRule(context),
    buildOddRule(context),
  ];
}

/**
 * Monta a linha a partir do total de escanteios do momento.
 *
 * O asiático é formatado com uma casa decimal de propósito: "OVER 7.0" e
 * "OVER 7.5" são mercados diferentes, e escrever "OVER 7" deixaria isso
 * ambíguo justo onde a diferença define PUSH ou RED (PRD sec. 18).
 */
function buildCornerEntryLine(
  context: StrategyContext,
  type: "limit" | "asian",
  half: "HT" | "FT"
): EntryLine | null {
  const total = context.metrics.cornersTotal;
  if (total === null) return null;

  const offset = context.config.params.line_offset ?? (type === "limit" ? 0.5 : 1);
  const line = total + offset;
  const printed = type === "asian" ? line.toFixed(1) : String(line);
  const suffix = type === "asian" ? " (LINHA ASIÁTICA)" : "";

  return {
    market: half === "HT" ? "corners_ht" : "corners_ft",
    type,
    line,
    label: `🚩 OVER ${printed} CANTOS ${half}${suffix}`,
  };
}

export function createCornerDefinition(options: {
  strategyId: StrategyId;
  requiredPeriod: Extract<MatchPeriod, "FIRST_HALF" | "SECOND_HALF">;
  type: "limit" | "asian";
  half: "HT" | "FT";
}): StrategyDefinition {
  return {
    strategyId: options.strategyId,
    requiredPeriod: options.requiredPeriod,
    cgBasis: "dominant",
    buildRules: buildCornerRules,
    buildEntryLine: (context) => buildCornerEntryLine(context, options.type, options.half),
  };
}

export { evaluateStrategy };
