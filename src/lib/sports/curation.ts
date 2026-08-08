import "server-only";
/**
 * Prioridade das competições vinda do banco.
 *
 * As regras de ordenação em si vivem em `curationRules.ts`, sem I/O, para
 * poderem ser testadas. Aqui só se busca o dado — e, como toda leitura de
 * `allowed_competitions`, degrada em vez de quebrar: sem a tabela, quem
 * chama cai na prioridade derivada do nome da competição.
 */
import { loadCompetitionPolicy } from "@/lib/sports/competitionRegistry";
import type { CompetitionPriority } from "@/lib/sports/curationRules";

export async function loadCompetitionPriority(): Promise<{ available: boolean; priority: CompetitionPriority }> {
  const { available, policy } = await loadCompetitionPolicy();
  if (!available || policy.size === 0) return { available: false, priority: new Map() };

  return {
    available: true,
    priority: new Map([...policy.values()].map((row) => [row.provider_competition_id, row.priority])),
  };
}

export {
  DEFAULT_PRIORITY,
  priorityOf,
  sortGroupsForDisplay,
  sortMatchesForDisplay,
  type CompetitionPriority,
} from "@/lib/sports/curationRules";
