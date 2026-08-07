/**
 * Resolução automática dos sinais (PRD sec. 34).
 *
 * Cada sinal gravado precisa virar GREEN / RED / PUSH / VOID sem ninguém
 * julgar na mão — é isso que permite auditar o motor depois e comparar
 * versões de estratégia. As funções aqui são puras e recebem os números
 * finais já apurados; quem os busca no banco é o coletor.
 *
 * A diferença entre limite e asiático é a razão de as duas modalidades
 * existirem separadas: no limite (x.5) não há empate possível; no asiático
 * (linha inteira) acertar a linha exata devolve a aposta.
 */
import type { SignalResultValue } from "@/lib/funil/types";

/**
 * Canto limite: linha x.5, então nunca empata.
 * 9 escanteios na entrada → OVER 9.5 → precisa de mais um.
 */
export function resolveCornerLimit(line: number, finalTotal: number | null): SignalResultValue {
  if (finalTotal === null) return "VOID";
  return finalTotal > line ? "GREEN" : "RED";
}

/**
 * Canto asiático: linha inteira com devolução.
 * 9 escanteios na entrada → OVER 10.0 → terminar com 9 é RED, com 10 é
 * PUSH (devolve) e com 11 ou mais é GREEN.
 */
export function resolveCornerAsian(line: number, finalTotal: number | null): SignalResultValue {
  if (finalTotal === null) return "VOID";
  if (finalTotal > line) return "GREEN";
  if (finalTotal === line) return "PUSH";
  return "RED";
}

/**
 * Over 0.5 gol HT. Se já havia gol quando o sinal saiu, o mercado estava
 * resolvido antes da entrada: marcar GREEN aí inflaria a taxa histórica com
 * um acerto que não existiu, então vira VOID.
 */
export function resolveGoalHt(goalsAtEntry: number | null, goalsAtHalftime: number | null): SignalResultValue {
  if (goalsAtEntry === null || goalsAtHalftime === null) return "VOID";
  if (goalsAtEntry > 0) return "VOID";
  return goalsAtHalftime > 0 ? "GREEN" : "RED";
}

/**
 * Over 0.5 gol restante: pelo menos mais um gol DEPOIS do sinal (PRD sec. 10)
 * — não é o total de gols da partida.
 */
export function resolveGoalRestOfMatch(goalsAtEntry: number | null, finalGoals: number | null): SignalResultValue {
  if (goalsAtEntry === null || finalGoals === null) return "VOID";
  return finalGoals > goalsAtEntry ? "GREEN" : "RED";
}

export interface SettlementInput {
  market: string;
  entryLine: number | null;
  /** Gols somados no momento da entrada. */
  goalsAtEntry: number | null;
  /** Escanteios somados no momento da entrada. */
  cornersAtEntry: number | null;
  /** Gols do primeiro tempo (para mercados HT). */
  goalsAtHalftime: number | null;
  /** Escanteios ao fim do primeiro tempo (para mercados HT). */
  cornersAtHalftime: number | null;
  finalGoals: number | null;
  finalCorners: number | null;
}

/**
 * Resolve qualquer sinal a partir do mercado gravado nele. Retorna também
 * o que decidiu o resultado, para o painel poder explicar sem adivinhação.
 */
export function settleSignal(input: SettlementInput): { result: SignalResultValue; resolvingEvent: string } {
  switch (input.market) {
    case "goals_ht": {
      const result = resolveGoalHt(input.goalsAtEntry, input.goalsAtHalftime);
      return { result, resolvingEvent: `Gols no 1T: ${input.goalsAtHalftime ?? "?"}` };
    }
    case "goals_rest_of_match": {
      const result = resolveGoalRestOfMatch(input.goalsAtEntry, input.finalGoals);
      return {
        result,
        resolvingEvent: `Gols na entrada: ${input.goalsAtEntry ?? "?"} → final: ${input.finalGoals ?? "?"}`,
      };
    }
    case "corners_ht": {
      if (input.entryLine === null) return { result: "VOID", resolvingEvent: "Linha de entrada ausente" };
      const total = input.cornersAtHalftime;
      const result = Number.isInteger(input.entryLine)
        ? resolveCornerAsian(input.entryLine, total)
        : resolveCornerLimit(input.entryLine, total);
      return { result, resolvingEvent: `Escanteios no 1T: ${total ?? "?"} (linha ${input.entryLine})` };
    }
    case "corners_ft": {
      if (input.entryLine === null) return { result: "VOID", resolvingEvent: "Linha de entrada ausente" };
      const total = input.finalCorners;
      const result = Number.isInteger(input.entryLine)
        ? resolveCornerAsian(input.entryLine, total)
        : resolveCornerLimit(input.entryLine, total);
      return { result, resolvingEvent: `Escanteios no jogo: ${total ?? "?"} (linha ${input.entryLine})` };
    }
    default:
      return { result: "VOID", resolvingEvent: `Mercado desconhecido: ${input.market}` };
  }
}
