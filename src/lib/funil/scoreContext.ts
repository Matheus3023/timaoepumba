/**
 * Contexto de placar para as estratégias de escanteio (PRD sec. 22).
 *
 * A regra mora aqui e não dentro de componente nenhum, e a lista de
 * contextos aceitos vem do config da estratégia — é assim que dá para
 * liberar outras situações pelo painel sem mexer em código.
 */
import type { ScoreContext, TeamSide } from "@/lib/funil/types";

export const DEFAULT_SCORE_CONTEXTS: ScoreContext[] = ["DRAW_0_0", "DRAW_1_1", "DOMINANT_LOSING_BY_1"];

export const SCORE_CONTEXT_LABEL: Record<ScoreContext, string> = {
  DRAW_0_0: "Empate 0 x 0",
  DRAW_1_1: "Empate 1 x 1",
  ANY_DRAW: "Qualquer empate",
  DOMINANT_LOSING_BY_1: "Dominante perdendo por 1",
};

export interface ScoreContextInput {
  scoreHome: number | null;
  scoreAway: number | null;
  dominantTeam: TeamSide | null;
}

export interface ScoreContextResult {
  /** "unavailable" quando falta placar ou dominante — não é o mesmo que reprovado. */
  status: "pass" | "fail" | "unavailable";
  matched: ScoreContext | null;
}

/**
 * Aprova quando o placar cai em algum dos contextos configurados.
 * Sem placar (ou sem dominante, para o contexto que depende dele) o
 * resultado é "unavailable": o motor trata isso como dado faltando, nunca
 * como critério reprovado.
 */
export function isCornerScoreContextValid(
  input: ScoreContextInput,
  contexts: ScoreContext[] = DEFAULT_SCORE_CONTEXTS
): ScoreContextResult {
  const { scoreHome, scoreAway, dominantTeam } = input;
  if (scoreHome === null || scoreAway === null) {
    return { status: "unavailable", matched: null };
  }

  let sawUnavailable = false;

  for (const context of contexts) {
    switch (context) {
      case "DRAW_0_0":
        if (scoreHome === 0 && scoreAway === 0) return { status: "pass", matched: context };
        break;
      case "DRAW_1_1":
        if (scoreHome === 1 && scoreAway === 1) return { status: "pass", matched: context };
        break;
      case "ANY_DRAW":
        if (scoreHome === scoreAway) return { status: "pass", matched: context };
        break;
      case "DOMINANT_LOSING_BY_1": {
        if (dominantTeam === null) {
          sawUnavailable = true;
          break;
        }
        const own = dominantTeam === "home" ? scoreHome : scoreAway;
        const rival = dominantTeam === "home" ? scoreAway : scoreHome;
        if (rival - own === 1) return { status: "pass", matched: context };
        break;
      }
    }
  }

  // Nenhum contexto bateu, mas um deles nem pôde ser avaliado: reportar
  // "fail" aqui esconderia que a informação estava faltando.
  return { status: sawUnavailable ? "unavailable" : "fail", matched: null };
}
