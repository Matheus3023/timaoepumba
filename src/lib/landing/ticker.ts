import "server-only";
/**
 * Jogos reais do ticker da landing page.
 *
 * A home publica mostrava quatro partidas inventadas em codigo
 * ("Corinthians 1-1 Palmeiras, 62'") enquanto a API de verdade rodava do
 * lado. Alem de ser vitrine falsa, o placar fake nunca mudava — qualquer
 * visitante que conferisse via que era enfeite.
 *
 * Reaproveita o MESMO cache que /jogos e /home ja mantem quente, entao a
 * landing nao gera nenhuma chamada extra ao provedor.
 */
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";
import type { Match } from "@/lib/sports/types";

export interface TickerMatch {
  id: string;
  league: string;
  homeName: string;
  homeLogo: string | null;
  awayName: string;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  live: boolean;
  minute: number | null;
  /** "21:30" para quem ainda nao comecou. */
  kickoffLabel: string;
}

const MAX_TICKER_MATCHES = 8;

function toTicker(match: Match): TickerMatch {
  return {
    id: match.id,
    league: match.league.name,
    homeName: match.homeTeam.name,
    homeLogo: match.homeTeam.logoUrl ?? null,
    awayName: match.awayTeam.name,
    awayLogo: match.awayTeam.logoUrl ?? null,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    live: match.status === "live",
    minute: match.minute ?? null,
    kickoffLabel: new Date(match.kickoffAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }),
  };
}

/**
 * Ao vivo primeiro, depois os proximos a comecar.
 *
 * Nunca inventa nada: se a API estiver fora e nao houver cache, devolve
 * lista vazia e a landing simplesmente nao mostra a faixa — bem melhor do
 * que exibir um jogo que nao existe.
 */
export async function loadTickerMatches(): Promise<TickerMatch[]> {
  const provider = getSportsDataProvider();

  try {
    const [{ data: live }, { data: today }] = await Promise.all([
      getOrSetCache(sportsCacheKey("live_matches", sportsDayKey()), CACHE_TTL_SECONDS.liveMatches, () =>
        provider.getLiveMatches()
      ),
      getOrSetCache(sportsCacheKey("matches", sportsDayKey()), CACHE_TTL_SECONDS.todayMatches, () =>
        provider.getTodayMatches()
      ),
    ]);

    const liveIds = new Set(live.map((match) => match.id));
    const upcoming = today
      .filter((match) => !liveIds.has(match.id) && match.status === "scheduled")
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

    return [...live, ...upcoming].slice(0, MAX_TICKER_MATCHES).map(toTicker);
  } catch (error) {
    console.error("[landing] nao foi possivel carregar o ticker", error);
    return [];
  }
}
