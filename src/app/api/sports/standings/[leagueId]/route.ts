import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey } from "@/lib/sports/cache";

export async function GET(_request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const provider = getSportsDataProvider();
  const { data, staleSince } = await getOrSetCache(
    sportsCacheKey("standings", leagueId),
    CACHE_TTL_SECONDS.standings,
    () => provider.getStandings(leagueId)
  );
  return NextResponse.json({ standings: data, stale_since: staleSince });
}
