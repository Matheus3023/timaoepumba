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

function pickString(obj: Record<string, unknown> | undefined | null, keys: string[], fallback = ""): string {
  if (!obj) return fallback;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return fallback;
}

function pickNumber(obj: Record<string, unknown> | undefined | null, keys: string[], fallback = 0): number {
  if (!obj) return fallback;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function pickArray(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    for (const key of keys) {
      const value = (payload as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/**
 * Extracts standing rows regardless of whether the API returns a flat
 * array of rows or an array of groups (e.g. home/away or multi-group
 * tournaments) each holding a nested "rows" array — tournaments/standings'
 * exact shape wasn't confirmed with a real example at write time, so this
 * degrades gracefully across the plausible variants instead of assuming one.
 */
function extractStandingRows(payload: unknown): unknown[] {
  const candidates = Array.isArray(payload) ? payload : pickArray(payload, ["standings", "table", "rows", "teams"]);
  if (
    candidates.length > 0 &&
    candidates[0] &&
    typeof candidates[0] === "object" &&
    Array.isArray((candidates[0] as Record<string, unknown>).rows)
  ) {
    return candidates.flatMap((group) => ((group as Record<string, unknown>).rows as unknown[]) ?? []);
  }
  return candidates;
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
    const payload = await this.request<unknown>("matches/match/summary", { match_id: matchId });
    const rawEvents = pickArray(payload, ["events", "incidents", "summary", "timeline"]);

    const TYPE_MAP: Record<string, MatchEvent["type"]> = {
      goal: "goal",
      Goal: "goal",
      yellow_card: "yellow_card",
      "yellow-card": "yellow_card",
      YellowCard: "yellow_card",
      red_card: "red_card",
      "red-card": "red_card",
      RedCard: "red_card",
      substitution: "substitution",
      Substitution: "substitution",
      sub: "substitution",
      var: "var",
      VAR: "var",
    };

    return rawEvents.map((item, index) => {
      const raw = item as Record<string, unknown>;
      const rawType = pickString(raw, ["type", "incident_type", "event_type"], "goal");
      const minute = pickNumber(raw, ["minute", "time", "minute_of_match"], NaN);
      return {
        id: pickString(raw, ["id", "incident_id", "event_id"], `${matchId}_evt_${index}`),
        minute: Number.isNaN(minute) ? null : minute,
        type: TYPE_MAP[rawType] ?? "goal",
        teamId: pickString(raw, ["team_id", "teamId"]) || null,
        playerName: pickString(raw, ["player_name", "player", "playerName"]) || null,
        detail: pickString(raw, ["detail", "description"]) || null,
      };
    });
  }

  /**
   * tournaments/standings requires BOTH tournament_stage_id and
   * tournament_id (unlike the rest of this interface, which addresses a
   * league by one id). Pass leagueId as "stageId:tournamentId"; a bare id
   * is used for both as a best-effort fallback.
   */
  async getStandings(leagueId: string): Promise<Standing[]> {
    const [tournamentStageId, tournamentId] = leagueId.includes(":") ? leagueId.split(":") : [leagueId, leagueId];
    const payload = await this.request<unknown>("tournaments/standings", {
      tournament_stage_id: tournamentStageId,
      tournament_id: tournamentId,
      type: "overall",
    });

    return extractStandingRows(payload).map((item, index) => {
      const raw = item as Record<string, unknown>;
      const teamRaw = (raw.team ?? raw) as Record<string, unknown>;
      return {
        teamId: pickString(teamRaw, ["team_id", "id"], `team_${index}`),
        teamName: pickString(teamRaw, ["name", "team_name", "short_name"], "Time"),
        position: pickNumber(raw, ["position", "rank", "place"], index + 1),
        played: pickNumber(raw, ["played", "matches_played", "games"]),
        wins: pickNumber(raw, ["wins", "won"]),
        draws: pickNumber(raw, ["draws", "drawn", "ties"]),
        losses: pickNumber(raw, ["losses", "lost", "defeats"]),
        goalsFor: pickNumber(raw, ["goals_for", "scored", "goalsFor"]),
        goalsAgainst: pickNumber(raw, ["goals_against", "conceded", "goalsAgainst"]),
        points: pickNumber(raw, ["points", "pts"]),
      };
    });
  }

  /** teamId is expected to be a team_url (e.g. "/team/corinthians/abc123/"), which is what teams/details and teams/squad require. */
  async getTeamDetails(teamId: string): Promise<TeamDetails> {
    const payload = await this.request<unknown>("teams/details", { team_url: teamId });
    const raw = (payload && typeof payload === "object" && "team" in (payload as object)
      ? (payload as Record<string, unknown>).team
      : payload) as Record<string, unknown>;

    const squad = await this.request<unknown>("teams/squad", { team_url: teamId })
      .then((squadPayload) =>
        pickArray(squadPayload, ["squad", "players"])
          .map((p) => pickString(p as Record<string, unknown>, ["name", "player_name", "short_name"]))
          .filter(Boolean)
      )
      .catch(() => [] as string[]);

    return {
      id: pickString(raw, ["team_id", "id"], teamId),
      name: pickString(raw, ["name", "team_name"], "Time"),
      logoUrl: pickString(raw, ["image_path", "small_image_path", "logo"]) || null,
      country: pickString(raw, ["country_name", "country"]) || null,
      squad,
    };
  }
}
