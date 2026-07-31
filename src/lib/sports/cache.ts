import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/** Cache TTLs per PRD sec. 12.4. */
export const CACHE_TTL_SECONDS = {
  todayMatches: 10 * 60,
  liveMatches: 45,
  standings: 6 * 60 * 60,
  teamsAndLeagues: 24 * 60 * 60,
} as const;

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
