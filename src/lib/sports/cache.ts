import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/** Cache TTLs per PRD sec. 12.4. */
export const CACHE_TTL_SECONDS = {
  todayMatches: 10 * 60,
  otherDayMatches: 30 * 60,
  liveMatches: 45,
  standings: 6 * 60 * 60,
  teamsAndLeagues: 24 * 60 * 60,
} as const;

/**
 * Bump whenever the shape or the filtering of cached payloads changes
 * (e.g. a league is added to/removed from the bestLeagues allowlist).
 * Cached rows store the provider's *already-filtered* output, so without
 * this a filter change wouldn't reach users until every TTL expired — and
 * there's no other way to invalidate short of deleting rows by hand.
 */
const CACHE_VERSION = "v2";

/**
 * Calendar date (YYYY-MM-DD) `dayOffset` days from now, in the same
 * timezone the sports API is queried with — so a key can't roll over to
 * the next day at a different moment than the data it points at.
 * `en-CA` formats as YYYY-MM-DD.
 */
export function sportsDayKey(dayOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Builds a version-prefixed cache key, so all call sites stay in sync. */
export function sportsCacheKey(...parts: (string | number)[]): string {
  return [CACHE_VERSION, ...parts].join(":");
}

/**
 * Read-through cache backed by sports_api_cache. On a cache miss it calls
 * `fetcher`; if `fetcher` throws (provider down — PRD sec. 12.5) and a
 * stale cached value exists, that stale value is returned instead of
 * failing the request, along with how old it is.
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; staleSince: string | null }> {
  const supabase = createAdminSupabaseClient();

  const { data: cached } = await supabase
    .from("sports_api_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  const isFresh = cached && new Date(cached.expires_at).getTime() > Date.now();
  if (isFresh) {
    return { data: cached!.payload as T, staleSince: null };
  }

  try {
    const fresh = await fetcher();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabase.from("sports_api_cache").upsert(
      { cache_key: key, payload: fresh as never, expires_at: expiresAt },
      { onConflict: "cache_key" }
    );
    return { data: fresh, staleSince: null };
  } catch (error) {
    await supabase.from("sports_api_logs").insert({
      endpoint: key,
      success: false,
      error_message: (error as Error).message,
    });

    if (cached) {
      // Serve the last known good payload rather than taking the app down.
      return { data: cached.payload as T, staleSince: cached.expires_at };
    }
    throw error;
  }
}
