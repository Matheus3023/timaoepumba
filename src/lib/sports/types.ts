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

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
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
  /** Minuto regulamentar já numérico ("45+3" → 45). */
  minute?: number | null;
  /**
   * Minuto exatamente como o provedor mandou ("45+3", "HT"), quando não é
   * um número puro. O motor Funil precisa disto para distinguir acréscimo
   * de segundo tempo e para reconhecer o intervalo (PRD sec. 45).
   */
  minuteLabel?: string | null;
  /**
   * `match_status.stage` do provedor ("Finished", e presumivelmente o
   * periodo quando ao vivo). Confirmado presente numa resposta real de
   * matches/list — vale mais que inferir o periodo pelo minuto.
   */
  stage?: string | null;
  /**
   * Cartoes vermelhos por time, que o provedor entrega direto no objeto do
   * time em matches/list. Nao dependem do endpoint de estatistica.
   */
  homeRedCards?: number | null;
  awayRedCards?: number | null;
  odds?: MatchOdds | null;
}

export interface MatchEvent {
  id: string;
  minute: number | null;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "unknown";
  teamId: string | null;
  playerName?: string | null;
  detail?: string | null;
}

export interface LineupPlayer {
  name: string;
  /** Número da camisa, se a Flashscore mandar. */
  number: string | null;
  isCaptain: boolean;
  isGoalkeeper: boolean;
}

export interface MatchLineup {
  /** A Flashscore identifica o time por lado, não por id — casamos com o
   *  time da casa/visitante pelo `side`. */
  side: "home" | "away";
  formation?: string | null;
  /** Titulares (ou a escalação provável, antes do time confirmado). */
  starters: LineupPlayer[];
  /** Reservas no banco. */
  substitutes: LineupPlayer[];
  /** true quando ainda é escalação PROVÁVEL (o time oficial não saiu). */
  predicted: boolean;
}

export interface MomentumPoint {
  minute: number;
  value: number;
}

export interface MatchDetails extends Match {
  events: MatchEvent[];
  lineups?: MatchLineup[];
  statistics?: Record<string, { home: number | string; away: number | string }>;
}

export interface HeadToHeadMatch {
  id: string;
  date: string | null;
  competition?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
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
  /** dayOffset: 0 = hoje, -1 = ontem, 1 = amanha, etc. */
  getMatchesForDay(dayOffset: number): Promise<Match[]>;
  getLiveMatches(): Promise<Match[]>;
  getMatchDetails(matchId: string): Promise<MatchDetails>;
  getMatchEvents(matchId: string): Promise<MatchEvent[]>;
  getMatchStats(matchId: string): Promise<Record<string, { home: number | string; away: number | string }>>;
  getHeadToHead(matchId: string): Promise<HeadToHeadMatch[]>;
  getTeamRecentMatches(teamId: string, limit?: number): Promise<HeadToHeadMatch[]>;
  getMatchLineups(matchId: string): Promise<MatchLineup[]>;
  getMatchMomentum(matchId: string): Promise<MomentumPoint[]>;
  getStandingsForMatch(matchId: string): Promise<Standing[]>;
  getStandings(leagueId: string): Promise<Standing[]>;
  getTeamDetails(teamId: string): Promise<TeamDetails>;
}
