/**
 * FUNIL_CORNER_HT_LIMIT — canto limite no primeiro tempo (PRD sec. 17).
 *
 * Janela padrão 37'–42'. Linha = total atual + 0.5, ou seja: basta mais um
 * escanteio antes do intervalo.
 */
import { createCornerDefinition, evaluateStrategy } from "@/lib/funil/strategies/corners";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

export const CORNER_HT_LIMIT_DEFINITION = createCornerDefinition({
  strategyId: "FUNIL_CORNER_HT_LIMIT",
  requiredPeriod: "FIRST_HALF",
  type: "limit",
  half: "HT",
});

export function evaluateCornerHTLimit(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(CORNER_HT_LIMIT_DEFINITION, snapshot, config);
}
