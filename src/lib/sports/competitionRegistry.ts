import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AllowedCompetitionRow } from "@/types/database";
import { evaluateContent } from "@/lib/sports/contentPolicy";
import { isBestLeague } from "@/lib/sports/bestLeagues";

const PROVIDER = "flashscore4";

/** A competition as seen in a raw provider response, before any curation. */
export interface DiscoveredCompetition {
  providerCompetitionId: string;
  name: string;
  countryName?: string | null;
  logoUrl?: string | null;
}

export type CompetitionPolicy = Map<string, AllowedCompetitionRow>;

export interface CompetitionPolicyResult {
  /**
   * False when the allowlist couldn't be read at all (table missing because
   * the migration hasn't run, connection error…). Callers must not confuse
   * this with a successfully-read but empty allowlist: the first means
   * "we don't know", the second means "nothing is catalogued yet".
   */
  available: boolean;
  policy: CompetitionPolicy;
}

/**
 * Loads the curated allowlist keyed by provider competition id.
 *
 * Deliberately does NOT fail closed. An earlier version returned an empty
 * map on error, which made every match disappear from the app the moment
 * the table was unreachable — a pending manual migration shouldn't be able
 * to blank the product. Callers degrade to the keyword classifier instead
 * (see curateMatches in flashscoreProvider.ts).
 */
export async function loadCompetitionPolicy(): Promise<CompetitionPolicyResult> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("allowed_competitions").select("*").eq("provider", PROVIDER);

  if (error) {
    console.error("[competitions] failed to load allowlist", error);
    return { available: false, policy: new Map() };
  }

  return {
    available: true,
    // Chave normalizada: o provedor devolve o MESMO id de competição com
    // caixa diferente conforme o endpoint. `matches/list` manda "edmhdnn8",
    // `matches/details` manda "EDMhdnN8" — e comparar cru fazia a curadoria
    // considerar a competição desconhecida na tela de detalhe, que respondia
    // 404 para TODO jogo. Ver `normalizeCompetitionId`.
    policy: new Map((data ?? []).map((row) => [normalizeCompetitionId(row.provider_competition_id), row])),
  };
}

/**
 * Id de competição comparável entre endpoints.
 *
 * O Flashscore devolve o mesmo identificador com caixa diferente dependendo
 * de onde ele aparece: a grade do dia manda minúsculo, o detalhe da partida
 * manda com maiúsculas. Toda comparação passa por aqui.
 */
export function normalizeCompetitionId(id: string): string {
  return id.trim().toLowerCase();
}

/**
 * Decides how a competition enters the table the first time it's seen.
 *
 * Blocked content is rejected outright. Otherwise the previous keyword
 * allowlist (bestLeagues.ts) acts as the initial classifier so the app
 * keeps working on rollout without an admin having to approve every major
 * league by hand — anything it doesn't recognize lands as inactive and
 * pending review, per PRD sec. 9.
 */
function classify(competition: DiscoveredCompetition) {
  const verdict = evaluateContent([competition.name, competition.countryName]);

  if (verdict.blocked) {
    return {
      is_active: false,
      requires_manual_review: false,
      gender: verdict.gender,
      blocked_reason: verdict.reason,
    };
  }

  if (isBestLeague(competition.name, competition.countryName)) {
    return { is_active: true, requires_manual_review: false, gender: "male" as const, blocked_reason: null };
  }

  return { is_active: false, requires_manual_review: true, gender: "male" as const, blocked_reason: null };
}

/**
 * Records every competition seen in a provider response. Rows that already
 * exist only get their "last seen" metadata refreshed — curation fields
 * (is_active, priority, display_name…) are never overwritten, so an admin's
 * decision always wins over the automatic classifier.
 */
export async function recordDiscoveredCompetitions(competitions: DiscoveredCompetition[]): Promise<void> {
  if (competitions.length === 0) return;

  const admin = createAdminSupabaseClient();
  const seenAt = new Date().toISOString();

  const byId = new Map(competitions.map((c) => [c.providerCompetitionId, c]));
  const ids = [...byId.keys()];

  const { data: existing, error: selectError } = await admin
    .from("allowed_competitions")
    .select("provider_competition_id")
    .eq("provider", PROVIDER)
    .in("provider_competition_id", ids);

  if (selectError) {
    console.error("[competitions] failed to check known competitions", selectError);
    return;
  }

  const knownIds = new Set((existing ?? []).map((row) => normalizeCompetitionId(row.provider_competition_id)));

  const inserts = [...byId.values()]
    .filter((competition) => !knownIds.has(normalizeCompetitionId(competition.providerCompetitionId)))
    .map((competition) => ({
      provider: PROVIDER,
      provider_competition_id: normalizeCompetitionId(competition.providerCompetitionId),
      canonical_name: competition.name,
      provider_name: competition.name,
      country_name: competition.countryName ?? null,
      logo_url: competition.logoUrl ?? null,
      first_seen_at: seenAt,
      last_seen_at: seenAt,
      ...classify(competition),
    }));

  const refreshes = [...byId.values()]
    .filter((competition) => knownIds.has(competition.providerCompetitionId))
    .map((competition) =>
      admin
        .from("allowed_competitions")
        .update({
          last_seen_at: seenAt,
          provider_name: competition.name,
          country_name: competition.countryName ?? null,
          logo_url: competition.logoUrl ?? null,
        })
        .eq("provider", PROVIDER)
        .eq("provider_competition_id", competition.providerCompetitionId)
    );

  const results = await Promise.all([
    inserts.length
      ? admin.from("allowed_competitions").insert(inserts)
      : Promise.resolve({ error: null }),
    ...refreshes,
  ]);

  for (const { error } of results) {
    if (error) console.error("[competitions] failed to record discovered competition", error);
  }
}
