/**
 * Static curated options for the onboarding personalization step (PRD
 * onboarding sec. 10). Not sports-data-provider content — just UI picker
 * values. Once the SportsDataProvider (see lib/sports) is synced, this can
 * be swapped for a live query against the `teams`/`leagues` tables.
 */
export const POPULAR_LEAGUES = [
  { id: "brasileirao", name: "Brasileirao Serie A" },
  { id: "champions-league", name: "Champions League" },
  { id: "libertadores", name: "Libertadores" },
  { id: "copa-do-brasil", name: "Copa do Brasil" },
  { id: "premier-league", name: "Premier League" },
  { id: "la-liga", name: "La Liga" },
];

export const POPULAR_TEAMS = [
  { id: "corinthians", name: "Corinthians" },
  { id: "palmeiras", name: "Palmeiras" },
  { id: "flamengo", name: "Flamengo" },
  { id: "sao-paulo", name: "Sao Paulo" },
  { id: "santos", name: "Santos" },
  { id: "vasco", name: "Vasco da Gama" },
  { id: "gremio", name: "Gremio" },
  { id: "internacional", name: "Internacional" },
];

export const ALERT_TYPES: { key: string; label: string }[] = [
  { key: "new_analysis", label: "Novas analises" },
  { key: "match_start", label: "Inicio de partidas" },
  { key: "live_goals", label: "Gols e eventos ao vivo" },
  { key: "community_news", label: "Novidades da comunidade" },
  { key: "account_updates", label: "Atualizacoes da conta" },
];
