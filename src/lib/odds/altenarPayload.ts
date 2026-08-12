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
 * O endpoint de detalhe usa uma forma DIFERENTE da lista, e a diferença é
 * silenciosa — ambos devolvem 200 com JSON parecido:
 *
 *   lista    (GetLiveEvents):   market.oddIds, evento aponta para mercados
 *   detalhe  (GetEventDetails): market.desktopOddIds / mobileOddIds, e é o
 *                               GRUPO que aponta para os mercados
 *
 * Ler o detalhe com o mapeador da lista devolve zero mercados sem erro
 * nenhum. Por isso os dois formatos moram aqui, lado a lado e testados.
 */
interface AltenarDetailsPayload {
  id?: number;
  name?: string | null;
  startDate?: string | null;
  liveTime?: string | null;
  ls?: string | null;
  markets?: (AltenarMarket & { desktopOddIds?: unknown[]; mobileOddIds?: unknown[] })[] | null;
  childMarkets?: (AltenarMarket & { desktopOddIds?: unknown[]; mobileOddIds?: unknown[] })[] | null;
  odds?: AltenarOdd[] | null;
  marketGroups?: { id: number; name?: string | null; marketIds?: number[] | null }[] | null;
  champ?: { name?: string | null } | null;
}

/** `desktopOddIds` às vezes vem aninhado (`[[1,2],[3]]`); achatamos sempre. */
function flattenIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...item.filter((x): x is number => typeof x === "number"));
    else if (typeof item === "number") out.push(item);
  }
  return out;
}

/**
 * Detalhe de um evento: todos os mercados, agrupados como a casa agrupa
 * ("Principal", "Escanteios", "2° tempo"...). O nome do grupo vai em cada
 * mercado para que quem consome possa pedir "os de escanteio" sem conhecer
 * id de grupo da Altenar.
 */
export function mapAltenarEventDetails(payload: unknown): HouseOddsEvent | null {
  const data = (payload ?? {}) as AltenarDetailsPayload;
  const name = typeof data.name === "string" ? data.name : "";
  const teams = splitEventName(name);
  if (!teams || !data.id || !data.startDate) return null;

  const oddById = new Map<number, AltenarOdd>();
  for (const odd of data.odds ?? []) oddById.set(odd.id, odd);

  const groupOfMarket = new Map<number, string>();
  for (const group of data.marketGroups ?? []) {
    for (const marketId of group.marketIds ?? []) {
      if (group.name) groupOfMarket.set(marketId, group.name);
    }
  }

  const markets: OddsMarket[] = [];
  for (const market of [...(data.markets ?? []), ...(data.childMarkets ?? [])]) {
    const ids = flattenIds(market.desktopOddIds).length
      ? flattenIds(market.desktopOddIds)
      : flattenIds(market.mobileOddIds).length
        ? flattenIds(market.mobileOddIds)
        : (market.oddIds ?? []);

    const selections: OddsSelection[] = [];
    for (const oddId of ids) {
      const odd = oddById.get(oddId);
      if (!odd || typeof odd.price !== "number" || !Number.isFinite(odd.price)) continue;
      selections.push({ name: odd.name ?? "", price: odd.price });
    }
    if (selections.length === 0) continue;

    markets.push({
      providerMarketId: String(market.id),
      name: market.name ?? "",
      line: market.sv ?? null,
      group: groupOfMarket.get(market.id) ?? null,
      selections,
    });
  }

  return {
    providerEventId: String(data.id),
    homeTeam: teams.home,
    awayTeam: teams.away,
    startsAt: new Date(data.startDate).toISOString(),
    championship: data.champ?.name ?? null,
    markets,
    liveClock: data.liveTime ?? null,
    livePeriod: data.ls ?? null,
  };
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
