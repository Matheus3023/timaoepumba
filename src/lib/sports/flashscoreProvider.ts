import "server-only";
import type { League, Match, MatchDetails, MatchEvent, SportsDataProvider, Standing, TeamDetails } from "@/lib/sports/types";

/** Raw shapes as returned by Flashscore4 on RapidAPI (confirmed via /admin/dados-esportivos). */
interface RawTeam {
  team_id: string;
  name: string;
  short_name?: string | null;
  small_image_path?: string | null;
}

interface RawMatchStatus {
  is_cancelled: boolean;
  is_postponed: boolean;
  is_started: boolean;
  is_in_progress: boolean;
  is_finished: boolean;
  is_finished_after_extra_time: boolean;
  is_finished_after_penalties: boolean;
  live_minute: number | string | null;
}

interface RawMatch {
  match_id: string;
  match_status: RawMatchStatus;
  timestamp: number;
  home_team: RawTeam;
  away_team: RawTeam;
  scores: { home: number | null; away: number | null };
}

interface RawTournamentGroup {
  tournament_id: string;
  name: string;
  country_name?: string | null;
  image_path?: string | null;
  matches: RawMatch[];
}

function isTournamentGroup(item: unknown): item is RawTournamentGroup {
  return !!item && typeof item === "object" && Array.isArray((item as RawTournamentGroup).matches);
}

function isRawMatch(item: unknown): item is RawMatch {
  return !!item && typeof item === "object" && typeof (item as RawMatch).match_id === "string";
}

function mapStatus(status: RawMatchStatus): Match["status"] {
  if (status.is_cancelled) return "canceled";
  if (status.is_postponed) return "postponed";
  if (status.is_finished || status.is_finished_after_extra_time || status.is_finished_after_penalties) return "finished";
  if (status.is_in_progress) return "live";
  return "scheduled";
}

function mapTeam(raw: RawTeam): Match["homeTeam"] {
  return { id: raw.team_id, name: raw.short_name || raw.name, logoUrl: raw.small_image_path ?? null };
}

function mapMatch(raw: RawMatch, league: League): Match {
  const minute = raw.match_status.live_minute;
  return {
    id: raw.match_id,
    league,
    homeTeam: mapTeam(raw.home_team),
    awayTeam: mapTeam(raw.away_team),
    homeScore: raw.scores?.home ?? null,
    awayScore: raw.scores?.away ?? null,
    status: mapStatus(raw.match_status),
    kickoffAt: new Date(raw.timestamp * 1000).toISOString(),
    minute: minute === null || minute === undefined ? null : Number(minute),
  };
}

/** Flattens the `matches/list` (and `matches/live`) response — grouped by tournament — into a flat Match[]. */
function flattenMatchesResponse(payload: unknown): Match[] {
  if (!Array.isArray(payload)) return [];

  const matches: Match[] = [];
  for (const item of payload) {
    if (isTournamentGroup(item)) {
      const league: League = {
        id: item.tournament_id,
        name: item.name,
        country: item.country_name ?? null,
        logoUrl: item.image_path ?? null,
      };
      for (const raw of item.matches) {
        matches.push(mapMatch(raw, league));
      }
    } else if (isRawMatch(item)) {
      // Defensive fallback in case an endpoint returns a flat match list
      // instead of grouped-by-tournament (unconfirmed for matches/live at
      // write time — it returned [] with no live matches to inspect).
      matches.push(mapMatch(item, { id: "desconhecido", name: "Outros jogos" }));
    }
  }
  return matches;
}

/**
 * Real integration with Flashscore4 on RapidAPI (PRD sec. 12.1). Endpoint
 * paths and the matches/list response shape were confirmed directly from
 * the RapidAPI console via the /admin/dados-esportivos debug tool.
 *
 * The RapidAPI key/host are read from server-only env vars and never sent
 * to the browser — this class is only ever imported from server code,
 * enforced by the `server-only` import.
 */
export class FlashscoreProvider implements SportsDataProvider {
  private readonly apiKey: string;
  private readonly apiHost: string;

  constructor() {
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST;
    if (!apiKey || !apiHost) {
      throw new Error("RAPIDAPI_KEY/RAPIDAPI_HOST not configured");
    }
    this.apiKey = apiKey;
    this.apiHost = apiHost;
  }

  private async request<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://${this.apiHost}/api/flashscore/v2/${path}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": this.apiHost,
        "x-rapidapi-key": this.apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Flashscore4 request failed: ${path} -> HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getTodayMatches(): Promise<Match[]> {
    const payload = await this.request<unknown>("matches/list", {
      sport_id: "1",
      day: "0",
      timezone: "America/Sao_Paulo",
    });
    return flattenMatchesResponse(payload);
  }

  async getLiveMatches(): Promise<Match[]> {
    const payload = await this.request<unknown>("matches/live", {
      sport_id: "1",
      timezone: "America/Sao_Paulo",
    });
    return flattenMatchesResponse(payload);
  }

  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    const payload = await this.request<unknown>("matches/details", { match_id: matchId });
    const matches = flattenMatchesResponse(payload);
    const match = matches[0] ?? (isRawMatch(payload) ? mapMatch(payload, { id: "desconhecido", name: "Jogo" }) : null);
    if (!match) {
      throw new Error(`FlashscoreProvider.getMatchDetails: unexpected response shape for match ${matchId}`);
    }

    let events: MatchEvent[] = [];
    try {
      events = await this.getMatchEvents(matchId);
    } catch {
      // matches/match/summary response shape not confirmed yet — degrade to
      // showing the match without an event timeline instead of failing the page.
    }

    return { ...match, events };
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    throw new Error(`FlashscoreProvider.getMatchEvents(${matchId}): matches/match/summary response shape not confirmed yet`);
  }

  async getStandings(leagueId: string): Promise<Standing[]> {
    throw new Error(`FlashscoreProvider.getStandings(${leagueId}): tournaments/standings response shape not confirmed yet`);
  }

  async getTeamDetails(teamId: string): Promise<TeamDetails> {
    throw new Error(`FlashscoreProvider.getTeamDetails(${teamId}): teams/details response shape not confirmed yet`);
  }
}
