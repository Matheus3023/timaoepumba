import "server-only";
import type { Match, MatchDetails, MatchEvent, SportsDataProvider, Standing, TeamDetails } from "@/lib/sports/types";

/**
 * Real integration with Flashscore4 on RapidAPI (PRD sec. 12.1). The exact
 * endpoint paths and response shapes are NOT guessed here — the PRD
 * explicitly forbids inventing RapidAPI endpoints. Each method is wired to
 * make the authenticated request once the real path/response mapping is
 * confirmed from the RapidAPI console for this API
 * (https://rapidapi.com/ — search "Flashscore4"), and throws a clear
 * "not implemented" error until then so callers fail loudly instead of
 * silently getting wrong data.
 *
 * See docs/sports-data-provider.md for the integration checklist.
 *
 * The RapidAPI key/host are read from server-only env vars and never sent
 * to the browser (PRD sec. 12.1/24) — this class is only ever imported
 * from server code (API routes), enforced by the `server-only` import.
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

  protected async request<T>(path: string): Promise<T> {
    const response = await fetch(`https://${this.apiHost}${path}`, {
      headers: {
        "X-RapidAPI-Key": this.apiKey,
        "X-RapidAPI-Host": this.apiHost,
      },
    });

    if (!response.ok) {
      throw new Error(`Flashscore4 request failed: ${path} -> HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getTodayMatches(): Promise<Match[]> {
    throw new Error(
      "FlashscoreProvider.getTodayMatches is not implemented: confirm the real Flashscore4 endpoint " +
        "and response mapping in the RapidAPI console before enabling this provider."
    );
  }

  async getLiveMatches(): Promise<Match[]> {
    throw new Error("FlashscoreProvider.getLiveMatches is not implemented: see docs/sports-data-provider.md");
  }

  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    throw new Error(`FlashscoreProvider.getMatchDetails(${matchId}) is not implemented: see docs/sports-data-provider.md`);
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    throw new Error(`FlashscoreProvider.getMatchEvents(${matchId}) is not implemented: see docs/sports-data-provider.md`);
  }

  async getStandings(leagueId: string): Promise<Standing[]> {
    throw new Error(`FlashscoreProvider.getStandings(${leagueId}) is not implemented: see docs/sports-data-provider.md`);
  }

  async getTeamDetails(teamId: string): Promise<TeamDetails> {
    throw new Error(`FlashscoreProvider.getTeamDetails(${teamId}) is not implemented: see docs/sports-data-provider.md`);
  }
}
