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
const CACHE_VERSION = "v3";

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
 * Drops every cached sports payload. Needed because payloads are stored
 * *already filtered* by the competition allowlist — without this, toggling
 * a competition in /admin/competicoes wouldn't reach users until each TTL
 * expired (up to 30 min). The table refills on the next request.
 */
export async function purgeSportsCache(): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("sports_api_cache").delete().neq("cache_key", "");
  if (error) console.error("[sports-cache] failed to purge", error);
}

/**
 * Quantas vezes o TTL um payload pode ficar vencido e ainda ser servido
 * quando o provedor está fora. Oito ciclos é bastante folga para uma queda
 * passageira e ainda assim curto o suficiente para não virar arqueologia.
 */
const STALE_TTL_MULTIPLIER = 8;

/**
 * Teto absoluto, independente do TTL. Sem ele, a classificação (TTL de 6h)
 * poderia ser servida com dois dias de idade — e o usuário não teria como
 * saber.
 */
export const ABSOLUTE_MAX_STALE_SECONDS = 6 * 60 * 60;

function maxStaleFor(ttlSeconds: number, override?: number): number {
  return Math.min(override ?? ttlSeconds * STALE_TTL_MULTIPLIER, ABSOLUTE_MAX_STALE_SECONDS);
}

/**
 * Read-through cache sobre sports_api_cache.
 *
 * Se o `fetcher` falhar (provedor fora) e existir um payload vencido, ele é
 * servido em vez de derrubar a página — mas só até um limite de idade.
 *
 * Esse limite é o ponto importante: antes, o cache vencido era servido
 * **sem nenhum teto**. Uma queda longa da API fazia o app exibir os jogos
 * de ontem como se fossem os de hoje, indefinidamente e sem avisar
 * ninguém. Dado velho demais é pior que erro: o erro a pessoa percebe.
 *
 * `staleSince` volta preenchido sempre que o dado é vencido, para a tela
 * poder dizer ao usuário que aquilo não está fresco.
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: { maxStaleSeconds?: number }
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
      const staleForSeconds = (Date.now() - new Date(cached.expires_at).getTime()) / 1000;
      const limit = maxStaleFor(ttlSeconds, options?.maxStaleSeconds);

      if (staleForSeconds <= limit) {
        return { data: cached.payload as T, staleSince: cached.expires_at };
      }

      console.warn(
        `[sports-cache] ${key} vencido ha ${Math.round(staleForSeconds)}s (limite ${limit}s) — recusando servir`
      );
    }
    throw error;
  }
}
