import type { HouseOddsEvent, OddsMarket, OddsSelection } from "@/lib/odds/types";

/**
 * Achatamento do payload da Altenar (plataforma do sportsbook da Bateu Bet).
 *
 * O formato é relacional normalizado, não aninhado: o evento só guarda ids, e
 * mercado, cotação e time vivem em listas irmãs no mesmo objeto. Montar um
 * mercado é seguir `event.marketIds` -> `markets[].oddIds` -> `odds[].price`.
 *
 * Função pura e sem `server-only` de propósito — o formato de um fornecedor
 * externo só fica seguro se estiver preso por teste. Ver o que aconteceu com
 * `getMatchStats` da Flashscore quando isso não existia.
 */

interface AltenarOdd {
  id: number;
  name?: string | null;
  price?: number | null;
}

interface AltenarMarket {
  id: number;
  name?: string | null;
  oddIds?: number[] | null;
  /** Linha do mercado ("3.5"); a Altenar chama de "special value". */
  sv?: string | null;
}

interface AltenarEvent {
  id: number;
  name?: string | null;
  startDate?: string | null;
  marketIds?: number[] | null;
  champId?: number | null;
}

interface AltenarPayload {
  events?: AltenarEvent[] | null;
  markets?: AltenarMarket[] | null;
  odds?: AltenarOdd[] | null;
  champs?: { id: number; name?: string | null }[] | null;
}

/**
 * A Altenar nomeia o evento como "Mandante vs. Visitante" — não há campo
 * separado por time. O separador é literal e estável; quando não aparecer,
 * devolvemos null em vez de chutar qual metade é quem.
 */
function splitEventName(name: string): { home: string; away: string } | null {
  const parts = name.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  const [home, away] = parts.map((part) => part.trim());
  if (!home || !away) return null;
  return { home, away };
}

export function mapAltenarEvents(payload: unknown): HouseOddsEvent[] {
  const data = (payload ?? {}) as AltenarPayload;
  const events = Array.isArray(data.events) ? data.events : [];
  if (events.length === 0) return [];

  const oddById = new Map<number, AltenarOdd>();
  for (const odd of data.odds ?? []) oddById.set(odd.id, odd);

  const marketById = new Map<number, AltenarMarket>();
  for (const market of data.markets ?? []) marketById.set(market.id, market);

  const champById = new Map<number, string>();
  for (const champ of data.champs ?? []) if (champ.name) champById.set(champ.id, champ.name);

  const mapped: HouseOddsEvent[] = [];

  for (const event of events) {
    const name = typeof event.name === "string" ? event.name : "";
    const teams = splitEventName(name);
    if (!teams || !event.startDate) continue;

    const markets: OddsMarket[] = [];
    for (const marketId of event.marketIds ?? []) {
      const market = marketById.get(marketId);
      if (!market) continue;

      const selections: OddsSelection[] = [];
      for (const oddId of market.oddIds ?? []) {
        const odd = oddById.get(oddId);
        // Cotação sem preço numérico é mercado suspenso — fora, em vez de
        // virar 0 e passar por odd baixíssima lá na frente.
        if (!odd || typeof odd.price !== "number" || !Number.isFinite(odd.price)) continue;
        selections.push({ name: odd.name ?? "", price: odd.price });
      }
      if (selections.length === 0) continue;

      markets.push({
        providerMarketId: String(market.id),
        name: market.name ?? "",
        line: market.sv ?? null,
        selections,
      });
    }

    mapped.push({
      providerEventId: String(event.id),
      homeTeam: teams.home,
      awayTeam: teams.away,
      startsAt: new Date(event.startDate).toISOString(),
      championship: event.champId != null ? (champById.get(event.champId) ?? null) : null,
      markets,
    });
  }

  return mapped;
}
