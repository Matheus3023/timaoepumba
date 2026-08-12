import "server-only";

import { fetchHouseEventDetails, fetchLiveHouseOdds, fetchUpcomingHouseOdds } from "@/lib/odds/altenarClient";
import {
  KICKOFF_TOLERANCE_MINUTES,
  LIVE_KICKOFF_TOLERANCE_MINUTES,
  matchFixtureToOdds,
} from "@/lib/odds/matchOdds";
import type { HouseOddsEvent, OddsMatchResult } from "@/lib/odds/types";
import type { Match } from "@/lib/sports/types";

/**
 * Odds da casa para uma partida da tela de jogo.
 *
 * Separado de `houseMarket.ts` de propósito: aquele alimenta a REGRA do motor
 * e por isso vive atrás de `HOUSE_ODDS_ENABLED`, já que ligar muda quais
 * sinais são emitidos. Este aqui só EXIBE — mostrar a cotação da casa ao lado
 * do jogo não altera nenhuma decisão do motor, então não depende da chave.
 *
 * Nunca lança: a tela de jogo tem de abrir mesmo com a casa fora do ar.
 */

/**
 * A grade de agendados é grande (perto de mil jogos) e muda devagar; a lista
 * ao vivo muda rápido. TTLs diferentes por isso — sem cache, cada abertura de
 * tela de jogo puxaria o catálogo inteiro da casa.
 */
const LIVE_TTL_MS = 30_000;
const UPCOMING_TTL_MS = 5 * 60_000;

let liveCache: { at: number; events: HouseOddsEvent[] } | null = null;
let upcomingCache: { at: number; events: HouseOddsEvent[] } | null = null;

async function cached(
  slot: "live" | "upcoming",
  ttl: number,
  load: () => Promise<HouseOddsEvent[]>
): Promise<HouseOddsEvent[]> {
  const current = slot === "live" ? liveCache : upcomingCache;
  if (current && Date.now() - current.at < ttl) return current.events;

  const events = await load();
  const entry = { at: Date.now(), events };
  if (slot === "live") liveCache = entry;
  else upcomingCache = entry;
  return events;
}

export async function getHouseOddsForMatch(match: Match): Promise<HouseOddsEvent | null> {
  const key = {
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    kickoffAt: match.kickoffAt,
  };

  // Em jogo ao vivo o `kickoffAt` que chega do provedor é "agora", não o
  // inicio — ver LIVE_KICKOFF_TOLERANCE_MINUTES.
  const tolerancia =
    match.status === "live" ? LIVE_KICKOFF_TOLERANCE_MINUTES : KICKOFF_TOLERANCE_MINUTES;

  try {
    // Ao vivo primeiro: quando a partida está rolando, é a cotação corrente
    // que interessa. Só cai para a grade quando não achar — e é esse fallback
    // que faz a tela funcionar para jogo agendado, que é a maioria dos casos.
    let found: OddsMatchResult = matchFixtureToOdds(
      key,
      await cached("live", LIVE_TTL_MS, () => fetchLiveHouseOdds()).catch(() => []),
      tolerancia
    );

    if (found.status !== "matched") {
      found = matchFixtureToOdds(
        key,
        await cached("upcoming", UPCOMING_TTL_MS, () => fetchUpcomingHouseOdds()).catch(() => []),
        tolerancia
      );
    }

    if (found.status !== "matched") return null;

    // A listagem traz poucos mercados; o detalhe traz todos, inclusive o
    // grupo de escanteios. Se o detalhe falhar, o que veio da listagem ainda
    // é melhor do que nada.
    const details = await fetchHouseEventDetails(found.event.providerEventId).catch(() => null);
    return details ?? found.event;
  } catch {
    return null;
  }
}

/** Mercados que valem destaque na tela, na ordem em que fazem sentido ler. */
const HIGHLIGHT_ORDER = ["Vencedor do encontro", "Vencedor", "Total de gols", "Total de escanteios", "Chance dupla"];

export function sortMarketsForDisplay(event: HouseOddsEvent): HouseOddsEvent["markets"] {
  const rank = (name: string): number => {
    const index = HIGHLIGHT_ORDER.findIndex((item) => name.toLowerCase().startsWith(item.toLowerCase()));
    return index === -1 ? HIGHLIGHT_ORDER.length : index;
  };
  return [...event.markets].sort((a, b) => rank(a.name) - rank(b.name));
}
