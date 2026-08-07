/**
 * T&P MOMENTUM — pressão recente (PRD sec. 23).
 *
 * Camada nossa, explicitamente separada das regras do Funil: momentum
 * alimenta o T&P Score e o card, e nunca altera se uma estratégia validou
 * ou não.
 *
 * O provedor não expõe eventos minuto a minuto, então tudo aqui sai do
 * histórico de snapshots que o próprio motor grava. Consequência honesta:
 * um jogo que o motor só começou a acompanhar aos 60' não tem base para
 * "últimos 10 minutos" e recebe `null` — não zero.
 */
import type { CornerObservation, LiveStats, TeamSide, TpMomentum } from "@/lib/funil/types";

export interface MomentumObservation {
  minute: number | null;
  collectedAt: string;
  stats: LiveStats;
}

export const EMPTY_MOMENTUM: TpMomentum = {
  dangerous_attacks_last_5m: null,
  dangerous_attacks_last_10m: null,
  shots_last_5m: null,
  shots_last_10m: null,
  corners_last_5m: null,
  corners_last_10m: null,
  possession_recent: null,
  time_since_last_corner: null,
  time_since_last_shot: null,
};

function totalOf(stats: LiveStats, fields: (keyof LiveStats)[]): number | null {
  let total = 0;
  for (const field of fields) {
    const value = stats[field];
    if (value === null) return null;
    total += value;
  }
  return total;
}

const DANGEROUS_ATTACKS: (keyof LiveStats)[] = ["dangerous_attacks_home", "dangerous_attacks_away"];
const SHOTS: (keyof LiveStats)[] = [
  "shots_on_target_home",
  "shots_on_target_away",
  "shots_off_target_home",
  "shots_off_target_away",
];
const CORNERS: (keyof LiveStats)[] = ["corners_home", "corners_away"];

/**
 * Observação mais recente com pelo menos `minutes` minutos de distância do
 * momento atual. Sem uma dessas, não há como calcular o delta e a resposta
 * tem de ser `null`.
 */
function baselineFor(
  history: MomentumObservation[],
  currentMinute: number,
  minutes: number
): MomentumObservation | null {
  const target = currentMinute - minutes;
  let best: MomentumObservation | null = null;
  for (const observation of history) {
    if (observation.minute === null) continue;
    if (observation.minute > target) continue;
    if (best === null || (best.minute ?? -Infinity) < observation.minute) best = observation;
  }
  return best;
}

function deltaOver(
  current: MomentumObservation,
  history: MomentumObservation[],
  minutes: number,
  fields: (keyof LiveStats)[]
): number | null {
  if (current.minute === null) return null;
  const baseline = baselineFor(history, current.minute, minutes);
  if (!baseline) return null;

  const currentTotal = totalOf(current.stats, fields);
  const baselineTotal = totalOf(baseline.stats, fields);
  if (currentTotal === null || baselineTotal === null) return null;

  // Correções retroativas do provedor podem derrubar um acumulado; um
  // delta negativo não é "pressão negativa", é dado inconsistente.
  const delta = currentTotal - baselineTotal;
  return delta < 0 ? null : delta;
}

/**
 * Momento em que um acumulado subiu pela última vez, e de qual lado.
 * Serve tanto para escanteio quanto para chute.
 */
function lastIncrease(
  observations: MomentumObservation[],
  homeField: keyof LiveStats,
  awayField: keyof LiveStats
): { minute: number; team: TeamSide | null } | null {
  const ordered = observations
    .filter((o) => o.minute !== null)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  let found: { minute: number; team: TeamSide | null } | null = null;
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    const homeDelta = diff(previous.stats[homeField], current.stats[homeField]);
    const awayDelta = diff(previous.stats[awayField], current.stats[awayField]);
    if (homeDelta === null && awayDelta === null) continue;
    if ((homeDelta ?? 0) <= 0 && (awayDelta ?? 0) <= 0) continue;

    const team: TeamSide | null =
      (homeDelta ?? 0) > 0 && (awayDelta ?? 0) > 0 ? null : (homeDelta ?? 0) > 0 ? "home" : "away";
    found = { minute: current.minute as number, team };
  }
  return found;
}

function diff(previous: number | null, current: number | null): number | null {
  if (previous === null || current === null) return null;
  return current - previous;
}

/**
 * Último escanteio observado. É derivado do delta entre snapshots, então a
 * precisão é a do intervalo de coleta (~1 min) e nunca a de um evento real
 * — motivo pelo qual isto não serve para contar escanteios sequenciais
 * (ver `detectSequentialCorners`).
 */
export function deriveLastCorner(observations: MomentumObservation[]): CornerObservation | null {
  return lastIncrease(observations, "corners_home", "corners_away");
}

export interface ComputeMomentumInput {
  current: MomentumObservation;
  /** Snapshots anteriores da mesma partida, em qualquer ordem. */
  history: MomentumObservation[];
}

export function computeMomentum({ current, history }: ComputeMomentumInput): TpMomentum {
  if (history.length === 0 || current.minute === null) return { ...EMPTY_MOMENTUM };

  const all = [...history, current];
  const lastCorner = deriveLastCorner(all);
  const lastShot = lastIncrease(all, "shots_on_target_home", "shots_on_target_away");

  return {
    dangerous_attacks_last_5m: deltaOver(current, history, 5, DANGEROUS_ATTACKS),
    dangerous_attacks_last_10m: deltaOver(current, history, 10, DANGEROUS_ATTACKS),
    shots_last_5m: deltaOver(current, history, 5, SHOTS),
    shots_last_10m: deltaOver(current, history, 10, SHOTS),
    corners_last_5m: deltaOver(current, history, 5, CORNERS),
    corners_last_10m: deltaOver(current, history, 10, CORNERS),
    // Posse é média corrida, não acumulado: diferença entre dois snapshots
    // não produz "posse dos últimos 5 minutos". Sem fonte para isso, `null`
    // é a resposta correta — qualquer número aqui seria inventado.
    possession_recent: null,
    time_since_last_corner: lastCorner ? current.minute - lastCorner.minute : null,
    time_since_last_shot: lastShot ? current.minute - lastShot.minute : null,
  };
}
