import "server-only";
import type {
  HeadToHeadMatch,
  League,
  Match,
  MatchDetails,
  MatchEvent,
  MatchLineup,
  MomentumPoint,
  SportsDataProvider,
  Standing,
  TeamDetails,
} from "@/lib/sports/types";
import { isBlockedContent } from "@/lib/sports/contentPolicy";

const BRASILEIRAO: League = { id: "league_brasileirao", name: "Brasileirao Serie A", country: "Brasil" };
const LIBERTADORES: League = { id: "league_libertadores", name: "Libertadores", country: "America do Sul" };

const TEAMS = {
  corinthians: { id: "team_corinthians", name: "Corinthians" },
  palmeiras: { id: "team_palmeiras", name: "Palmeiras" },
  flamengo: { id: "team_flamengo", name: "Flamengo" },
  saoPaulo: { id: "team_sao_paulo", name: "Sao Paulo" },
  santos: { id: "team_santos", name: "Santos" },
  gremio: { id: "team_gremio", name: "Gremio" },
};

function todayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const MOCK_MATCHES: Match[] = [
  {
    id: "match_1",
    league: BRASILEIRAO,
    homeTeam: TEAMS.corinthians,
    awayTeam: TEAMS.palmeiras,
    homeScore: 1,
    awayScore: 1,
    status: "live",
    kickoffAt: todayAt(16, 0),
    minute: 62,
  },
  {
    id: "match_2",
    league: BRASILEIRAO,
    homeTeam: TEAMS.flamengo,
    awayTeam: TEAMS.saoPaulo,
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    kickoffAt: todayAt(18, 30),
  },
  {
    id: "match_3",
    league: LIBERTADORES,
    homeTeam: TEAMS.santos,
    awayTeam: TEAMS.gremio,
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    kickoffAt: todayAt(21, 0),
  },
];

const MOCK_EVENTS: Record<string, MatchEvent[]> = {
  match_1: [
    { id: "evt_1", minute: 23, type: "goal", teamId: TEAMS.corinthians.id, playerName: "Jogador A" },
    { id: "evt_2", minute: 55, type: "goal", teamId: TEAMS.palmeiras.id, playerName: "Jogador B" },
    { id: "evt_3", minute: 60, type: "yellow_card", teamId: TEAMS.palmeiras.id, playerName: "Jogador C" },
  ],
};

const MOCK_STANDINGS: Record<string, Standing[]> = {
  league_brasileirao: [
    { teamId: TEAMS.palmeiras.id, teamName: "Palmeiras", position: 1, played: 20, wins: 14, draws: 4, losses: 2, goalsFor: 38, goalsAgainst: 15, points: 46 },
    { teamId: TEAMS.flamengo.id, teamName: "Flamengo", position: 2, played: 20, wins: 13, draws: 4, losses: 3, goalsFor: 36, goalsAgainst: 18, points: 43 },
    { teamId: TEAMS.corinthians.id, teamName: "Corinthians", position: 3, played: 20, wins: 11, draws: 5, losses: 4, goalsFor: 30, goalsAgainst: 20, points: 38 },
  ],
};

/**
 * Deterministic in-memory sports data used until the real RapidAPI
 * (Flashscore4) integration is wired up, and as a safety net if that
 * provider is unavailable (PRD sec. 12.5 "evitar que o aplicativo fique
 * completamente fora do ar").
 */
/**
 * Applied to the fixtures too, so this provider — which is the default, and
 * the silent fallback when RAPIDAPI_KEY is missing — can't behave more
 * permissively than the real one if a fixture is ever added for a blocked
 * competition.
 */
function allowed(match: Match): boolean {
  return !isBlockedContent({
    competitionName: match.league.name,
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
  });
}

export class MockSportsDataProvider implements SportsDataProvider {
  async getTodayMatches(): Promise<Match[]> {
    return MOCK_MATCHES.filter(allowed);
  }

  async getMatchesForDay(dayOffset: number): Promise<Match[]> {
    return dayOffset === 0 ? MOCK_MATCHES.filter(allowed) : [];
  }

  async getLiveMatches(): Promise<Match[]> {
    return MOCK_MATCHES.filter((m) => m.status === "live" && allowed(m));
  }

  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    const match = MOCK_MATCHES.find((m) => m.id === matchId);
    if (!match || !allowed(match)) throw new Error(`Match not found: ${matchId}`);
    return { ...match, events: MOCK_EVENTS[matchId] ?? [] };
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    return MOCK_EVENTS[matchId] ?? [];
  }

  async getMatchStats(): Promise<Record<string, { home: number | string; away: number | string }>> {
    return {};
  }

  async getHeadToHead(): Promise<HeadToHeadMatch[]> {
    return [];
  }

  async getTeamRecentMatches(): Promise<HeadToHeadMatch[]> {
    return [];
  }

  async getMatchLineups(): Promise<MatchLineup[]> {
    return [];
  }

  async getMatchMomentum(): Promise<MomentumPoint[]> {
    return [];
  }

  async getStandingsForMatch(): Promise<Standing[]> {
    return [];
  }

  async getStandings(leagueId: string): Promise<Standing[]> {
    return MOCK_STANDINGS[leagueId] ?? [];
  }

  async getTeamDetails(teamId: string): Promise<TeamDetails> {
    const team = Object.values(TEAMS).find((t) => t.id === teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    return { ...team, country: "Brasil" };
  }
}
