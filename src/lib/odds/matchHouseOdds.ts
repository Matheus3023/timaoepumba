import "server-only";

import { fetchHouseEventDetails, fetchLiveHouseOdds } from "@/lib/odds/altenarClient";
import { matchFixtureToOdds } from "@/lib/odds/matchOdds";
import type { HouseOddsEvent } from "@/lib/odds/types";
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
export async function getHouseOddsForMatch(match: Match): Promise<HouseOddsEvent | null> {
  try {
    const events = await fetchLiveHouseOdds();
    const found = matchFixtureToOdds(
      { homeTeamName: match.homeTeam.name, awayTeamName: match.awayTeam.name, kickoffAt: match.kickoffAt },
      events
    );

    if (found.status !== "matched") return null;

    // A listagem ao vivo traz poucos mercados; o detalhe traz todos,
    // inclusive o grupo de escanteios. Se o detalhe falhar, o que veio da
    // listagem ainda é melhor do que nada.
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
