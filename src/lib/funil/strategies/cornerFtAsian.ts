/**
 * FUNIL_CORNER_FT_ASIAN — canto asiático no segundo tempo (PRD sec. 21).
 *
 * Monitora a partir de ~83'. Linha inteira = total atual + 1.0, com a mesma
 * leitura do asiático de HT: 0 escanteios a mais RED, 1 PUSH, 2+ GREEN.
 */
import { createCornerDefinition, evaluateStrategy } from "@/lib/funil/strategies/corners";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

export const CORNER_FT_ASIAN_DEFINITION = createCornerDefinition({
  strategyId: "FUNIL_CORNER_FT_ASIAN",
  requiredPeriod: "SECOND_HALF",
  type: "asian",
  half: "FT",
});

export function evaluateCornerFTAsian(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(CORNER_FT_ASIAN_DEFINITION, snapshot, config);
}
