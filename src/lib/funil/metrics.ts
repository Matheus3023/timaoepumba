/**
 * Fórmulas do Funil (PRD secs. 4–7, 11–13).
 *
 * Tudo aqui é função pura sobre números anuláveis. A convenção é sempre a
 * mesma: se qualquer parcela necessária for `null`, o resultado é `null`.
 * Nenhuma função "assume zero" para conseguir devolver um número — é
 * exatamente isso que faria o motor emitir sinal em cima de dado ausente.
 *
 * A precisão é mantida integral; arredondamento é assunto da interface.
 */
import type { CornerObservation, FunilMetrics, LiveStats, PreMatchOdds, TeamSide } from "@/lib/funil/types";

/** Soma que propaga `null`: uma parcela desconhecida torna o total desconhecido. */
function sumOrNull(...values: (number | null)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return total;
}

/**
 * APPM — ataques perigosos por minuto (PRD sec. 4).
 *
 * Minuto 0 devolve `null` em vez de dividir por zero: no primeiro minuto
 * não existe "por minuto" que signifique alguma coisa.
 */
export function calculateAppm(dangerousAttacks: number | null, liveMinute: number | null): number | null {
  if (dangerousAttacks === null || liveMinute === null) return null;
  if (liveMinute <= 0) return null;
  return dangerousAttacks / liveMinute;
}

/** CG — chance de gol: chutes no alvo + chutes para fora + escanteios (PRD sec. 5). */
export function calculateCg(
  shotsOnTarget: number | null,
  shotsOffTarget: number | null,
  corners: number | null
): number | null {
  return sumOrNull(shotsOnTarget, shotsOffTarget, corners);
}

/**
 * BO — balanceamento de odds (PRD sec. 6). Sempre com odds PRÉ-JOGO:
 * odd ao vivo já embute o que aconteceu na partida e destruiria o sentido
 * da métrica.
 */
export function calculateBo(odds: PreMatchOdds | null | undefined): number | null {
  if (!odds) return null;
  const { home, away } = odds;
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home <= 0 || away <= 0) return null;

  const favorite = Math.min(home, away);
  const underdog = Math.max(home, away);
  return underdog / favorite;
}

/**
 * RM — rendimento (PRD sec. 7): APPM do dominante × posse dele em pontos
 * percentuais. Posse de 72% entra como 72, não 0.72 — daí a recusa de
 * valores <= 1, que denunciariam uma fração vinda normalizada errada.
 */
export function calculateRm(dominantAppm: number | null, dominantPossession: number | null): number | null {
  if (dominantAppm === null || dominantPossession === null) return null;
  if (dominantPossession <= 1 || dominantPossession > 100) return null;
  return dominantAppm * dominantPossession;
}

/**
 * Time dominante = o de mais ataques perigosos (PRD sec. 4). Como o minuto
 * é o mesmo para os dois lados, ordenar por contagem ou por APPM dá no
 * mesmo. Empate exato não elege ninguém: sem dominante, nenhuma estratégia
 * que dependa dele pode validar.
 */
export function detectDominantTeam(stats: LiveStats): TeamSide | null {
  const home = stats.dangerous_attacks_home;
  const away = stats.dangerous_attacks_away;
  if (home === null || away === null) return null;
  if (home === away) return null;
  return home > away ? "home" : "away";
}

/**
 * Escanteios sequenciais (PRD sec. 12).
 *
 * Só conta quando temos eventos de escanteio de verdade — minuto e time por
 * escanteio. Hoje o provedor não expõe isso; o que derivamos do delta entre
 * nossos snapshots é aproximado demais (dois escanteios dentro da mesma
 * janela de coleta podem ou não ter sido uma sequência). Nesse caso o PRD é
 * explícito: devolver `null` e avisar, em vez de inventar a sequência a
 * partir do total.
 */
export function detectSequentialCorners(
  events: CornerObservation[] | null | undefined,
  options: { precise: boolean }
): number | null {
  if (!options.precise) return null;
  if (!events || events.length < 2) return events ? 0 : null;

  const ordered = [...events].sort((a, b) => a.minute - b.minute);
  let sequential = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (current.team === null || previous.team === null) continue;
    if (current.team === previous.team && current.minute - previous.minute <= 1) {
      sequential += 1;
    }
  }
  return sequential;
}

export interface ComputeMetricsInput {
  stats: LiveStats;
  liveMinute: number | null;
  preMatchOdds: PreMatchOdds | null;
  cornerEvents?: CornerObservation[] | null;
  /** True só quando os escanteios vêm com minuto/time confiáveis do provedor. */
  preciseCornerEvents?: boolean;
}

/** Calcula de uma vez todas as métricas que as estratégias consomem. */
export function computeMetrics(input: ComputeMetricsInput): FunilMetrics {
  const { stats, liveMinute, preMatchOdds } = input;

  const appmHome = calculateAppm(stats.dangerous_attacks_home, liveMinute);
  const appmAway = calculateAppm(stats.dangerous_attacks_away, liveMinute);
  const dominantTeam = detectDominantTeam(stats);

  const cgHome = calculateCg(stats.shots_on_target_home, stats.shots_off_target_home, stats.corners_home);
  const cgAway = calculateCg(stats.shots_on_target_away, stats.shots_off_target_away, stats.corners_away);
  const cgTotal = sumOrNull(cgHome, cgAway);

  const dominantAppm = dominantTeam === null ? null : dominantTeam === "home" ? appmHome : appmAway;
  const dominantPossession =
    dominantTeam === null ? null : dominantTeam === "home" ? stats.possession_home : stats.possession_away;
  const cgDominant = dominantTeam === null ? null : dominantTeam === "home" ? cgHome : cgAway;

  const sequentialCornerCount = detectSequentialCorners(input.cornerEvents, {
    precise: input.preciseCornerEvents === true,
  });
  const cgAdjusted =
    cgTotal === null ? null : sequentialCornerCount === null ? cgTotal : cgTotal - sequentialCornerCount;

  return {
    appmHome,
    appmAway,
    dominantTeam,
    dominantAppm,
    dominantPossession,
    cgHome,
    cgAway,
    cgTotal,
    cgDominant,
    cgAdjusted,
    sequentialCornerCount,
    shotsOnTargetTotal: sumOrNull(stats.shots_on_target_home, stats.shots_on_target_away),
    cornersTotal: sumOrNull(stats.corners_home, stats.corners_away),
    bo: calculateBo(preMatchOdds),
    rm: calculateRm(dominantAppm, dominantPossession),
    // Só é `true` com expulsão conhecida. Dado ausente não vira "teve
    // expulsão" — mas também não bloqueia nada, só afeta o T&P Score.
    redCardContext: (stats.red_cards_home ?? 0) > 0 || (stats.red_cards_away ?? 0) > 0,
  };
}
