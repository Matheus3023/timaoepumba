/**
 * INITIAL CLASSIFIER ONLY — this is no longer what decides whether a match
 * is shown. That decision now lives in the `allowed_competitions` table,
 * keyed by the provider's competition id and curated by an admin at
 * /admin/competicoes (see competitionRegistry.ts).
 *
 * This keyword list runs exactly once per competition: the first time one
 * is seen in an API response, a match here means the competition is
 * activated automatically, so the app didn't go blank when the DB-backed
 * allowlist shipped empty. Anything not recognized lands as inactive and
 * pending manual review.
 *
 * Consequence: adding a keyword here does NOT re-enable a competition that
 * already has a row — to fix a missing or unwanted league, use the admin
 * panel, not this file.
 *
 * Matching is keyword + optional country, both normalized (lowercase,
 * accents stripped), because the real tournament name strings returned by
 * the API are unconfirmed for most of these leagues — sponsor prefixes
 * ("Brasileirao Assai Serie A") and country-ambiguous names ("Serie A"
 * means Brazil or Italy depending on context) are common in football data
 * feeds.
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
