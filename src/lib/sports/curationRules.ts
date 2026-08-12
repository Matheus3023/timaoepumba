/**
 * Regras puras de ordenação das partidas (Fase 2 da curadoria).
 *
 * Separado de `curation.ts` porque aquele é `server-only` (lê o banco) e
 * não carrega em teste unitário. Aqui não há I/O: dá para verificar a
 * ordem com uma lista na mão.
 *
 * O problema que isto resolve: a resposta do provedor vem agrupada por
 * torneio em ordem alfabética. Sem reordenar, a Home abria com
 * "AFRICA: CECAFA Kagame Cup" e o Brasileirão ficava lá embaixo.
 */
import { isBestLeague } from "@/lib/sports/bestLeagues";
import type { Match } from "@/lib/sports/types";

export type CompetitionPriority = Map<string, number>;

/** Competições de peso máximo quando não há tabela para consultar. */
const TOP_TIER_KEYWORDS = [
  "brasileir",
  "copa do brasil",
  "libertadores",
  "sul-americana",
  "sudamericana",
  "champions league",
  "europa league",
  "copa america",
  "world cup",
  "eliminatorias",
  "mundial de clubes",
];

export const DEFAULT_PRIORITY = 3;

function keywordPriority(name: string, country?: string | null): number {
  const normalized = name.toLowerCase();
  if (TOP_TIER_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 1;
  if (isBestLeague(name, country)) return 2;
  return DEFAULT_PRIORITY;
}

/** Ao vivo primeiro, depois o que ainda vai começar, encerrado por último. */
function statusRank(match: Match): number {
  if (match.status === "live") return 0;
  if (match.status === "scheduled") return 1;
  return 2;
}

export function priorityOf(match: Match, priority: CompetitionPriority, available: boolean): number {
  if (available) {
    // Mesmo motivo do policy: o provedor varia a caixa do id entre
    // endpoints (ver normalizeCompetitionId).
    return priority.get(match.league.id.trim().toLowerCase()) ?? DEFAULT_PRIORITY;
  }
  return keywordPriority(match.league.name, match.league.country);
}

/**
 * Ordena para exibição: estado da partida, depois peso da competição,
 * depois horário. Um Brasileirão que começa às 21h aparece antes de uma
 * liga secundária que começa às 16h — a Home é vitrine, não agenda.
 */
export function sortMatchesForDisplay(
  matches: Match[],
  priority: CompetitionPriority,
  available: boolean
): Match[] {
  return [...matches].sort((a, b) => {
    const byStatus = statusRank(a) - statusRank(b);
    if (byStatus !== 0) return byStatus;

    const byPriority = priorityOf(a, priority, available) - priorityOf(b, priority, available);
    if (byPriority !== 0) return byPriority;

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

/**
 * Ordena os grupos de `/jogos` pela melhor prioridade que cada competição
 * tem, para o topo da lista ser o que o torcedor procura.
 */
export function sortGroupsForDisplay(
  groups: [string, Match[]][],
  priority: CompetitionPriority,
  available: boolean
): [string, Match[]][] {
  return [...groups].sort(([, aMatches], [, bMatches]) => {
    const a = priorityOf(aMatches[0], priority, available);
    const b = priorityOf(bMatches[0], priority, available);
    if (a !== b) return a - b;

    return new Date(aMatches[0].kickoffAt).getTime() - new Date(bMatches[0].kickoffAt).getTime();
  });
}
