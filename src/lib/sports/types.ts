export interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface League {
  id: string;
  name: string;
  country?: string | null;
  logoUrl?: string | null;
}

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "canceled";
  kickoffAt: string;
  minute?: number | null;
}

export interface MatchEvent {
  id: string;
  minute: number | null;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var";
  teamId: string | null;
  playerName?: string | null;
  detail?: string | null;
}

export interface MatchDetails extends Match {
  events: MatchEvent[];
  lineups?: { teamId: string; players: string[] }[];
  statistics?: Record<string, { home: number | string; away: number | string }>;
}

export interface Standing {
  teamId: string;
  teamName: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface TeamDetails extends Team {
  country?: string | null;
  squad?: string[];
}

/**
 * Backend abstraction over the sports data source (PRD sec. 12.3). All
 * frontend/API-route code depends on this interface, never on a specific
 * vendor, so the provider can be swapped (or the app can fall back to the
 * mock) without touching callers.
 */
export interface SportsDataProvider {
  getTodayMatches(): Promise<Match[]>;
  getLiveMatches(): Promise<Match[]>;
  getMatchDetails(matchId: string): Promise<MatchDetails>;
  getMatchEvents(matchId: string): Promise<MatchEvent[]>;
  getStandings(leagueId: string): Promise<Standing[]>;
  getTeamDetails(teamId: string): Promise<TeamDetails>;
}
