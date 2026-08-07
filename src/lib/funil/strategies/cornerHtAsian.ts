/**
 * FUNIL_CORNER_HT_ASIAN — canto asiático no primeiro tempo (PRD sec. 18).
 *
 * Monitora a partir de ~38'. Linha inteira = total atual + 1.0:
 * nenhum escanteio a mais é RED, exatamente um devolve (PUSH), dois ou mais
 * é GREEN.
 */
import { createCornerDefinition, evaluateStrategy } from "@/lib/funil/strategies/corners";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

export const CORNER_HT_ASIAN_DEFINITION = createCornerDefinition({
  strategyId: "FUNIL_CORNER_HT_ASIAN",
  requiredPeriod: "FIRST_HALF",
  type: "asian",
  half: "HT",
});

export function evaluateCornerHTAsian(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(CORNER_HT_ASIAN_DEFINITION, snapshot, config);
}
