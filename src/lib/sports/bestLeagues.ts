/**
 * Allowlist used to keep only the leagues/cups that matter to this app's
 * audience out of `matches/list` and `matches/live` — those endpoints
 * return every football competition worldwide (including obscure lower
 * divisions and youth leagues) grouped by tournament, completely
 * unfiltered.
 *
 * Every match from an allowlisted competition is shown — an earlier
 * version also required a "well-known club" for cup competitions, but
 * that caused more confusion than it solved (legitimate Copa do Brasil
 * matches with real clubs like Cruzeiro got second-guessed) and was
 * removed.
 *
 * Matching is keyword + optional country, both normalized (lowercase,
 * accents stripped), because the real tournament name strings returned by
 * the API are unconfirmed for most of these leagues — sponsor prefixes
 * ("Brasileirao Assai Serie A") and country-ambiguous names ("Serie A"
 * means Brazil or Italy depending on context) are common in football data
 * feeds. If a league that should appear is missing (or one that shouldn't
 * still shows up), the fix is almost always adding/adjusting a rule here
 * once the real name is seen in production.
 */
interface LeagueRule {
  keyword: string;
  /** Required when the keyword alone is ambiguous between countries. */
  country?: string;
}

/**
 * Checked before BEST_LEAGUE_RULES, for competitions whose names would
 * otherwise false-positive against the keywords below:
 *  - celebrity/7-a-side leagues ("Kings World Cup Clubs" contains "world cup")
 *  - women's competitions ("Brasileiro Women" contains "brasileir"), which
 *    this app doesn't cover
 */
const EXCLUDE_KEYWORDS = [
  "kings league",
  "kings world cup",
  "kings cup",
  "queens league",
  "baller league",
  "women",
  "feminin",
  "femenin",
  "ladies",
];

const BEST_LEAGUE_RULES: LeagueRule[] = [
  // Brasil
  { keyword: "brasileir", country: "brazil" },
  { keyword: "serie a", country: "brazil" },
  { keyword: "serie b", country: "brazil" },
  { keyword: "copa do brasil", country: "brazil" },

  // America do Sul
  { keyword: "libertadores" },
  { keyword: "sul-americana" },
  { keyword: "sudamericana" },
  { keyword: "recopa" },

  // Europa - competicoes continentais
  { keyword: "champions league" },
  { keyword: "europa league" },
  { keyword: "conference league" },

  // Europa - ligas nacionais principais
  { keyword: "premier league", country: "england" },
  { keyword: "la liga", country: "spain" },
  { keyword: "laliga", country: "spain" },
  { keyword: "serie a", country: "italy" },
  { keyword: "bundesliga", country: "germany" },
  { keyword: "ligue 1", country: "france" },
  { keyword: "primeira liga", country: "portugal" },

  // Selecoes / torneios de selecoes
  { keyword: "copa america" },
  { keyword: "world cup" },
  { keyword: "eurocopa" },
  { keyword: "euro " },
  { keyword: "eliminatorias" },
  { keyword: "mundial de clubes" },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Returns true if this tournament is in the allowlist (and not an excluded celebrity/7-a-side league). */
export function isBestLeague(name: string, country?: string | null): boolean {
  const normalizedName = normalize(name);

  if (EXCLUDE_KEYWORDS.some((keyword) => normalizedName.includes(keyword))) return false;

  const normalizedCountry = country ? normalize(country) : "";

  return BEST_LEAGUE_RULES.some((rule) => {
    if (!normalizedName.includes(rule.keyword)) return false;
    if (rule.country && !normalizedCountry.includes(rule.country)) return false;
    return true;
  });
}
