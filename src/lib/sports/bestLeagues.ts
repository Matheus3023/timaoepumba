/**
 * Allowlist used to keep only the leagues/cups that matter to this app's
 * audience out of `matches/list` and `matches/live` — those endpoints
 * return every football competition worldwide (including obscure lower
 * divisions and youth leagues) grouped by tournament, completely
 * unfiltered.
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
  /**
   * "league": show every match — a domestic round-robin (or a national-team
   * tournament, which is already sparse) is a narrow, relevant list on its
   * own.
   * "cup": early/group rounds can have dozens of simultaneous matches
   * between minor clubs, so also require a well-known club playing (see
   * BIG_CLUB_KEYWORDS below) instead of showing every fixture.
   */
  type: "league" | "cup";
}

const BEST_LEAGUE_RULES: LeagueRule[] = [
  // Brasil
  { keyword: "brasileir", country: "brazil", type: "league" },
  { keyword: "serie a", country: "brazil", type: "league" },
  { keyword: "serie b", country: "brazil", type: "league" },
  { keyword: "copa do brasil", country: "brazil", type: "cup" },

  // America do Sul
  { keyword: "libertadores", type: "cup" },
  { keyword: "sul-americana", type: "cup" },
  { keyword: "sudamericana", type: "cup" },
  { keyword: "recopa", type: "cup" },

  // Europa - competicoes continentais
  { keyword: "champions league", type: "cup" },
  { keyword: "europa league", type: "cup" },
  { keyword: "conference league", type: "cup" },

  // Europa - ligas nacionais principais
  { keyword: "premier league", country: "england", type: "league" },
  { keyword: "la liga", country: "spain", type: "league" },
  { keyword: "laliga", country: "spain", type: "league" },
  { keyword: "serie a", country: "italy", type: "league" },
  { keyword: "bundesliga", country: "germany", type: "league" },
  { keyword: "ligue 1", country: "france", type: "league" },
  { keyword: "primeira liga", country: "portugal", type: "league" },

  // Selecoes / torneios de selecoes — ja sao listas enxutas por natureza
  { keyword: "copa america", type: "league" },
  { keyword: "world cup", type: "league" },
  { keyword: "eurocopa", type: "league" },
  { keyword: "euro ", type: "league" },
  { keyword: "eliminatorias", type: "league" },
  { keyword: "mundial de clubes", type: "cup" },
];

/**
 * Clubs big enough that their cup matches are worth showing even in early
 * rounds. Not exhaustive by design — this is a curated "worth showing"
 * list, not a ranking. Easy to extend once real team names from the API
 * are seen in production.
 */
const BIG_CLUB_KEYWORDS = [
  // Brasil
  "corinthians",
  "palmeiras",
  "flamengo",
  "sao paulo",
  "santos",
  "vasco",
  "gremio",
  "internacional",
  "atletico mineiro",
  "atletico-mg",
  "cruzeiro",
  "fluminense",
  "botafogo",
  "bahia",
  "fortaleza",
  "athletico paranaense",
  "atletico paranaense",
  // America do Sul
  "boca juniors",
  "river plate",
  "penarol",
  "nacional",
  "colo-colo",
  "universidad de chile",
  "independiente del valle",
  "barcelona sc",
  "olimpia",
  "cerro porteno",
  // Europa
  "real madrid",
  "barcelona",
  "manchester city",
  "manchester united",
  "liverpool",
  "chelsea",
  "arsenal",
  "tottenham",
  "bayern",
  "dortmund",
  "paris saint",
  "psg",
  "juventus",
  "milan",
  "napoli",
  "atletico madrid",
  "porto",
  "benfica",
  "sporting",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Returns the matching rule (with its "league"/"cup" type), or null if this tournament isn't in the allowlist. */
export function getLeagueRule(name: string, country?: string | null): LeagueRule | null {
  const normalizedName = normalize(name);
  const normalizedCountry = country ? normalize(country) : "";

  return (
    BEST_LEAGUE_RULES.find((rule) => {
      if (!normalizedName.includes(rule.keyword)) return false;
      if (rule.country && !normalizedCountry.includes(rule.country)) return false;
      return true;
    }) ?? null
  );
}

export function isBigClubTeam(teamName: string): boolean {
  const normalized = normalize(teamName);
  return BIG_CLUB_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
