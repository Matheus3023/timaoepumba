import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";

export async function GET() {
  const provider = getSportsDataProvider();
  const { data, staleSince } = await getOrSetCache(
    sportsCacheKey("live_matches", sportsDayKey()),
    CACHE_TTL_SECONDS.liveMatches,
    () => provider.getLiveMatches()
  );
  return NextResponse.json({ matches: data, stale_since: staleSince });
}
