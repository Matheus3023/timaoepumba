/**
 * Registro das seis estratégias. É o único ponto que o motor consulta para
 * saber "quais estratégias existem" — adicionar uma sétima é acrescentar
 * uma linha aqui, sem tocar no coletor nem na máquina de estados.
 */
import { CORNER_FT_ASIAN_DEFINITION } from "@/lib/funil/strategies/cornerFtAsian";
import { CORNER_FT_LIMIT_DEFINITION } from "@/lib/funil/strategies/cornerFtLimit";
import { CORNER_HT_ASIAN_DEFINITION } from "@/lib/funil/strategies/cornerHtAsian";
import { CORNER_HT_LIMIT_DEFINITION } from "@/lib/funil/strategies/cornerHtLimit";
import { GOAL_FT_DEFINITION } from "@/lib/funil/strategies/goalFt";
import { GOAL_HT_DEFINITION } from "@/lib/funil/strategies/goalHt";
import { evaluateStrategy, type StrategyDefinition } from "@/lib/funil/strategies/common";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation, StrategyId } from "@/lib/funil/types";

export const STRATEGY_DEFINITIONS: Record<StrategyId, StrategyDefinition> = {
  FUNIL_GOAL_HT: GOAL_HT_DEFINITION,
  FUNIL_GOAL_FT: GOAL_FT_DEFINITION,
  FUNIL_CORNER_HT_LIMIT: CORNER_HT_LIMIT_DEFINITION,
  FUNIL_CORNER_HT_ASIAN: CORNER_HT_ASIAN_DEFINITION,
  FUNIL_CORNER_FT_LIMIT: CORNER_FT_LIMIT_DEFINITION,
  FUNIL_CORNER_FT_ASIAN: CORNER_FT_ASIAN_DEFINITION,
};

/**
 * Avalia uma estratégia pelo id. Mesma assinatura pedida no PRD sec. 40 —
 * serve para partida ao vivo e para snapshot histórico de backtest, porque
 * não depende de nada além dos dois argumentos.
 */
export function evaluateStrategyById(
  strategyId: StrategyId,
  snapshot: FixtureSnapshot,
  config: StrategyConfig
): StrategyEvaluation {
  return evaluateStrategy(STRATEGY_DEFINITIONS[strategyId], snapshot, config);
}

export { evaluateCornerFTAsian } from "@/lib/funil/strategies/cornerFtAsian";
export { evaluateCornerFTLimit } from "@/lib/funil/strategies/cornerFtLimit";
export { evaluateCornerHTAsian } from "@/lib/funil/strategies/cornerHtAsian";
export { evaluateCornerHTLimit } from "@/lib/funil/strategies/cornerHtLimit";
export { evaluateGoalFT } from "@/lib/funil/strategies/goalFt";
export { evaluateGoalHT } from "@/lib/funil/strategies/goalHt";
export { evaluateStrategy } from "@/lib/funil/strategies/common";
export type { StrategyDefinition } from "@/lib/funil/strategies/common";
