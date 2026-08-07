/**
 * FUNIL_CORNER_FT_LIMIT — canto limite no segundo tempo (PRD sec. 20).
 *
 * Janela padrão 86'–89'. Linha = total atual + 0.5.
 */
import { createCornerDefinition, evaluateStrategy } from "@/lib/funil/strategies/corners";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

export const CORNER_FT_LIMIT_DEFINITION = createCornerDefinition({
  strategyId: "FUNIL_CORNER_FT_LIMIT",
  requiredPeriod: "SECOND_HALF",
  type: "limit",
  half: "FT",
});

export function evaluateCornerFTLimit(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(CORNER_FT_LIMIT_DEFINITION, snapshot, config);
}
