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

/**
 * Loads the curated allowlist keyed by provider competition id. Callers
 * decide what to do with a missing entry — for match lists that means
 * "hide", since a competition is only shown once an admin activates it.
 */
export async function loadCompetitionPolicy(): Promise<CompetitionPolicy> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("allowed_competitions").select("*").eq("provider", PROVIDER);

  if (error) {
    // Fail closed on the allowlist but keep the app alive: an empty policy
    // hides everything rather than leaking unvetted competitions.
    console.error("[competitions] failed to load allowlist", error);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.provider_competition_id, row]));
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

  const knownIds = new Set((existing ?? []).map((row) => row.provider_competition_id));

  const inserts = [...byId.values()]
    .filter((competition) => !knownIds.has(competition.providerCompetitionId))
    .map((competition) => ({
      provider: PROVIDER,
      provider_competition_id: competition.providerCompetitionId,
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
