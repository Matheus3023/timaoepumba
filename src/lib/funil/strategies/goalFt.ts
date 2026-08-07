/**
 * FUNIL_GOAL_FT — Over 0.5 gol no restante da partida (PRD secs. 10 a 14).
 *
 * Roda no segundo tempo. Janela padrão 55'–85', que é adaptação operacional
 * do Timão e Pumba e não regra imutável do método — por isso vive no config.
 *
 * Critérios: APPM do dominante ≥ 1.00, chutes no alvo somados > 10 (maior
 * que, não maior-ou-igual — PRD sec. 13) e CG somado ≥ 30.
 *
 * O CG usado é o ajustado por escanteios sequenciais. Como o provedor atual
 * não entrega eventos de escanteio, `sequentialCornerCount` fica `null` e o
 * ajustado cai no CG bruto, com o aviso registrado para auditoria —
 * exatamente o que a sec. 12 manda fazer em vez de inventar a sequência.
 */
import { buildOddRule, compareRule, evaluateStrategy, type StrategyDefinition } from "@/lib/funil/strategies/common";
import type { EntryLine, FixtureSnapshot, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

const GOAL_FT_ENTRY_LINE: EntryLine = {
  market: "goals_rest_of_match",
  type: "binary",
  line: 0.5,
  label: "⚽ +0.5 GOL RESTANTE",
};

export const GOAL_FT_DEFINITION: StrategyDefinition = {
  strategyId: "FUNIL_GOAL_FT",
  requiredPeriod: "SECOND_HALF",
  cgBasis: "total",
  buildRules(context) {
    const { metrics, config } = context;
    const cgValue = metrics.cgAdjusted ?? metrics.cgTotal;
    const cgDetail =
      metrics.sequentialCornerCount === null
        ? "CG bruto — sequência de escanteios não disponível no provedor."
        : `CG ajustado em ${metrics.sequentialCornerCount} escanteio(s) sequencial(is).`;

    return [
      compareRule("appm", "APPM", metrics.dominantAppm, config.params.min_appm, "gte"),
      compareRule(
        "shots_on_target",
        "Chutes no alvo (soma)",
        metrics.shotsOnTargetTotal,
        config.params.min_shots_on_target_total,
        "gt"
      ),
      compareRule("cg", "CG total", cgValue, config.params.min_cg_total, "gte", cgDetail),
      buildOddRule(context),
    ];
  },
  buildEntryLine() {
    return GOAL_FT_ENTRY_LINE;
  },
};

export function evaluateGoalFT(snapshot: FixtureSnapshot, config: StrategyConfig): StrategyEvaluation {
  return evaluateStrategy(GOAL_FT_DEFINITION, snapshot, config);
}
