import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";

export async function GET() {
  const provider = getSportsDataProvider();
  const { data, staleSince } = await getOrSetCache(
    sportsCacheKey("matches", sportsDayKey()),
    CACHE_TTL_SECONDS.todayMatches,
    () => provider.getTodayMatches()
  );
  return NextResponse.json({ matches: data, stale_since: staleSince });
}
