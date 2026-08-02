/**
 * Hard content block (competition curation PRD sec. 2 and 8), applied
 * independently of — and before — the competition allowlist.
 *
 * Two reasons this exists separately from the allowlist:
 *  - it also inspects TEAM names, not just the competition name, which
 *    catches youth/reserve fixtures listed under a senior competition;
 *  - it decides the initial `gender` / `blocked_reason` for a newly
 *    discovered competition, so an admin never has to manually reject the
 *    obvious cases in /admin/competicoes.
 *
 * The provider gives us no gender field, so gender is inferred from names.
 * Per the PRD's own fallback rule, anything whose gender can't be
 * identified is still gated by the allowlist.
 */

/** Substring terms — safe to match anywhere, none appear inside unrelated words. */
const BLOCKED_SUBSTRINGS: { term: string; reason: string }[] = [
  { term: "women", reason: "futebol feminino" },
  { term: "woman", reason: "futebol feminino" },
  { term: "ladies", reason: "futebol feminino" },
  { term: "feminin", reason: "futebol feminino" }, // feminino/feminina
  { term: "femenin", reason: "futebol feminino" }, // femenino/femenina (es)
  { term: "femmes", reason: "futebol feminino" },
  { term: "frauen", reason: "futebol feminino" },
  { term: "youth", reason: "categoria de base" },
  { term: "juvenil", reason: "categoria de base" },
  { term: "academy", reason: "categoria de base" },
  { term: "reserve", reason: "time reserva" }, // covers "reserves"
  { term: "e-soccer", reason: "futebol virtual" },
  { term: "esoccer", reason: "futebol virtual" },
  { term: "virtual", reason: "futebol virtual" },
  { term: "team b", reason: "time B" },
];

/**
 * Age categories, matched with word boundaries rather than as raw
 * substrings: a bare `includes("u20")` would also hit unrelated names, and
 * hiding a real match is worse here than letting one through.
 */
const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(u|sub)-?(15|16|17|18|19|20|21|23)\b/, reason: "categoria de base" },
];

const FEMALE_TERMS = new Set(["women", "woman", "ladies", "feminin", "femenin", "femmes", "frauen"]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface BlockResult {
  blocked: boolean;
  /** Human-readable cause, stored in allowed_competitions.blocked_reason. */
  reason: string | null;
  /** Inferred from the matched term — only "female" is ever concluded positively. */
  gender: "male" | "female" | "unknown";
}

/**
 * Checks a competition name and, when available, both team names. Any part
 * matching a blocked term rejects the whole match.
 */
export function evaluateContent(parts: (string | null | undefined)[]): BlockResult {
  const haystack = normalize(parts.filter(Boolean).join(" "));

  for (const { term, reason } of BLOCKED_SUBSTRINGS) {
    if (haystack.includes(term)) {
      return { blocked: true, reason, gender: FEMALE_TERMS.has(term) ? "female" : "unknown" };
    }
  }

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(haystack)) {
      return { blocked: true, reason, gender: "unknown" };
    }
  }

  return { blocked: false, reason: null, gender: "male" };
}

/** Convenience wrapper for the per-match check in the sports providers. */
export function isBlockedContent(input: {
  competitionName?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
}): boolean {
  return evaluateContent([input.competitionName, input.homeTeamName, input.awayTeamName]).blocked;
}
