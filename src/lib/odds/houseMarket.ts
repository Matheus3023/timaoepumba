import "server-only";

import { fetchHouseEventDetails, fetchLiveHouseOdds } from "@/lib/odds/altenarClient";
import { findCornerOverOdd } from "@/lib/odds/cornerMarket";
import { matchFixtureToOdds } from "@/lib/odds/matchOdds";
import type { FixtureKey, HouseOddsEvent } from "@/lib/odds/types";
import type { LiveMarket } from "@/lib/funil/types";

/**
 * Ponte entre o motor e o sportsbook da casa.
 *
 * Desligado por padrão: preencher `snapshot.market` faz a regra de odd sair
 * de "not_evaluated" e passar a valer, e `min_odd` já está configurado em 4
 * das 6 estratégias (2.0, 1.6, 1.7). Ou seja, ligar isto muda quais sinais
 * são emitidos. A chave fica com o operador, não com o deploy.
 */
export function houseOddsEnabled(): boolean {
  return process.env.HOUSE_ODDS_ENABLED === "true";
}

let cache: { at: number; events: HouseOddsEvent[] } | null = null;
const LIVE_LIST_TTL_MS = 45_000;

/**
 * Lista de jogos ao vivo da casa, com TTL curto. O tick roda a cada 60s e
 * pode consultar várias partidas no mesmo ciclo — sem isto seria uma chamada
 * por partida só para redescobrir a mesma lista.
 */
async function liveEvents(): Promise<HouseOddsEvent[]> {
  if (cache && Date.now() - cache.at < LIVE_LIST_TTL_MS) return cache.events;
  const events = await fetchLiveHouseOdds();
  cache = { at: Date.now(), events };
  return events;
}

export interface HouseMarketLookup {
  market: LiveMarket | null;
  /** Por que não veio mercado — vai para o log, não para a tela. */
  diagnostic: string;
}

/**
 * Mercado de escanteios da casa para uma partida nossa, na linha pedida.
 *
 * Devolve sempre um diagnóstico junto: "não achei o jogo na casa" e "achei o
 * jogo mas a casa não oferece essa linha" são problemas diferentes, e o
 * segundo é o esperado perto do fim do jogo — a casa fecha o mercado de
 * escanteios nos minutos finais, que é justamente quando as estratégias de
 * canto disparam.
 */
export async function lookupCornerMarket(
  fixture: FixtureKey,
  targetLine: number | null
): Promise<HouseMarketLookup> {
  if (!houseOddsEnabled()) return { market: null, diagnostic: "desligado" };
  if (targetLine === null) return { market: null, diagnostic: "sem linha alvo" };

  try {
    const match = matchFixtureToOdds(fixture, await liveEvents());
    if (match.status !== "matched") {
      return { market: null, diagnostic: `casamento: ${match.status}` };
    }

    const details = await fetchHouseEventDetails(match.event.providerEventId);
    if (!details) return { market: null, diagnostic: "detalhe do evento vazio" };

    const found = findCornerOverOdd(details, targetLine);
    if (!found) {
      return {
        market: {
          currentMarket: `Escanteios mais de ${targetLine}`,
          marketStatus: "closed",
          currentLine: targetLine,
          currentOdd: null,
        },
        diagnostic: `casa nao oferece a linha ${targetLine}`,
      };
    }

    return {
      market: {
        currentMarket: found.marketName,
        marketStatus: "open",
        currentLine: found.line,
        currentOdd: found.odd,
      },
      diagnostic: "ok",
    };
  } catch (error) {
    // Falha de mercado nunca pode derrubar o tick: o sinal estatístico vale
    // por si, e a odd é complemento.
    return { market: null, diagnostic: `erro: ${(error as Error).message}` };
  }
}
