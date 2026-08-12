import "server-only";

import { fetchLiveHouseOdds, fetchUpcomingHouseOdds } from "@/lib/odds/altenarClient";
import { matchFixtureToOdds } from "@/lib/odds/matchOdds";
import type { HouseOddsEvent } from "@/lib/odds/types";
import type { Match } from "@/lib/sports/types";

/**
 * Cobertura da casa: quais partidas do provedor de dados têm mercado na
 * Bateu Bet.
 *
 * O app existe para gerar aposta. Jogo que a casa não oferece é peso morto:
 * ocupa a lista, o usuário abre, não encontra odd e sai. Por isso a casa
 * passa a decidir o que aparece — o provedor de dados continua sendo a fonte
 * de estatística e análise, mas não manda mais na vitrine.
 */

const TTL_MS = 5 * 60_000;

let cache: { at: number; events: HouseOddsEvent[] } | null = null;

/**
 * Catálogo da casa (ao vivo + agenda). Devolve `null` quando não deu para
 * carregar — e esse `null` é importante: quem chama NÃO pode tratar
 * indisponibilidade da casa como "nenhum jogo tem odd", senão uma queda
 * do sportsbook esvazia o app inteiro.
 */
export async function loadHouseCatalog(): Promise<HouseOddsEvent[] | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.events;

  try {
    const [live, upcoming] = await Promise.all([
      fetchLiveHouseOdds().catch(() => [] as HouseOddsEvent[]),
      fetchUpcomingHouseOdds().catch(() => [] as HouseOddsEvent[]),
    ]);
    const events = [...live, ...upcoming];
    if (events.length === 0) return null;

    cache = { at: Date.now(), events };
    return events;
  } catch {
    return null;
  }
}

/**
 * Mantém apenas as partidas que a casa cobre.
 *
 * FALHA ABERTA de propósito: sem catálogo, devolve a lista inteira. Preferir
 * mostrar jogo sem odd a mostrar tela vazia — o usuário que abre um app de
 * palpites e não vê jogo nenhum não volta.
 */
export async function filterToHouseCovered<T extends Match>(
  matches: T[]
): Promise<{ matches: T[]; filtered: boolean; hidden: number }> {
  const catalog = await loadHouseCatalog();
  if (!catalog) return { matches, filtered: false, hidden: 0 };

  const cobertos = matches.filter((match) => {
    const resultado = matchFixtureToOdds(
      {
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffAt: match.kickoffAt,
      },
      catalog
    );
    return resultado.status === "matched";
  });

  // Se o casamento derrubar tudo, algo está errado com a heurística e não
  // com a casa — melhor mostrar a lista crua do que uma tela vazia.
  if (cobertos.length === 0) return { matches, filtered: false, hidden: 0 };

  return { matches: cobertos, filtered: true, hidden: matches.length - cobertos.length };
}
