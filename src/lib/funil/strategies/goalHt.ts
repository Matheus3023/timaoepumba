/**
 * FUNIL_GOAL_HT — Over 0.5 gol no primeiro tempo (PRD secs. 8 e 9).
 *
 * Janela padrão 30' até o fim do primeiro tempo. Critérios: APPM ≥ 1.30,
 * CG do dominante ≥ 10, BO ≥ 6 e RM ≥ 100.
 *
 * BO e RM podem sair "unavailable" (sem odds pré-jogo, sem posse de bola).
 * Isso é sinalizado e não reprova — ver a explicação em common.ts.
 */
import { buildOddRule, compareRule, evaluateStrategy, type StrategyDefinition } from "@/lib/funil/strategies/common";
import type { EntryLine, FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

const GOAL_HT_ENTRY_LINE: EntryLine = {
  market: "goals_ht",
  type: "binary",
  line: 0.5,
  label: "⚽ +0.5 GOL HT",
};

export const GOAL_HT_DEFINITION: StrategyDefinition = {
  strategyId: "FUNIL_GOAL_HT",
  requiredPeriod: "FIRST_HALF",
  cgBasis: "dominant",
  buildRules(context) {
    const { metrics, config } = context;
    return [
      compareRule("appm", "APPM", metrics.dominantAppm, config.params.min_appm, "gte"),
      compareRule("cg", "CG", metrics.cgDominant, config.params.min_cg_dominant, "gte"),
      compareRule("bo", "BO", metrics.bo, config.params.min_bo, "gte", "Dado BO indisponível quando não há odds pré-jogo."),
      compareRule("rm", "RM", metrics.rm, config.params.min_rm, "gte", "Depende da posse de bola do time dominante."),
      buildOddRule(context),
    ];
  },
  buildEntryLine() {
    return GOAL_HT_ENTRY_LINE;
  },
};

export function evaluateGoalHT(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(GOAL_HT_DEFINITION, snapshot, config);
}
