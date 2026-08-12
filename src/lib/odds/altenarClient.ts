import "server-only";

import { mapAltenarEvents } from "@/lib/odds/altenarPayload";
import type { HouseOddsEvent } from "@/lib/odds/types";

/**
 * Cliente do sportsbook da casa.
 *
 * O sportsbook da Bateu Bet é white-label da Altenar — a Bateu é inquilina da
 * plataforma (`integration=bateu`), não a dona do feed. Isto aqui consome o
 * endpoint do widget, que é interno e não documentado: pode mudar sem aviso e
 * usá-lo em produção é assunto de contrato com a Altenar, não com a Bateu.
 *
 * Por isso tudo é configurável por variável de ambiente e tudo passa por
 * `mapAltenarEvents`: trocar por um feed oficial deve ser mudança de
 * configuração e de um adapter, nunca reescrita de quem consome.
 */

const BASE_URL = process.env.HOUSE_ODDS_BASE_URL ?? "https://sb2frontend-altenar2.biahosted.com/api";
const INTEGRATION = process.env.HOUSE_ODDS_INTEGRATION ?? "bateu";

/** Futebol na taxonomia da Altenar. Não é o mesmo id da Flashscore. */
export const ALTENAR_FOOTBALL_SPORT_ID = 66;

const DEFAULT_TIMEOUT_MS = 8000;

function buildUrl(path: string, extra: Record<string, string>): string {
  const url = new URL(`${BASE_URL}/${path}`);
  const base: Record<string, string> = {
    culture: "pt-BR",
    timezoneOffset: "180",
    integration: INTEGRATION,
    deviceType: "1",
    numFormat: "en-GB",
    countryCode: "BR",
  };
  for (const [key, value] of Object.entries({ ...base, ...extra })) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Jogos ao vivo com as cotações correntes da casa.
 *
 * Lança em falha de rede ou status não-2xx em vez de devolver lista vazia:
 * "a casa não tem jogo ao vivo" e "não consegui falar com a casa" são coisas
 * diferentes, e quem chama precisa poder distinguir — foi exatamente essa
 * confusão que manteve o motor cego por semanas do lado da Flashscore.
 */
export async function fetchLiveHouseOdds(
  sportId: number = ALTENAR_FOOTBALL_SPORT_ID,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HouseOddsEvent[]> {
  const url = buildUrl("widget/GetLiveEvents", { sportId: String(sportId) });

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Odds da casa: HTTP ${response.status} em widget/GetLiveEvents`);
  }

  return mapAltenarEvents(await response.json());
}
