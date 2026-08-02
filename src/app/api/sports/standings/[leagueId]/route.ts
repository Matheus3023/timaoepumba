import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey } from "@/lib/sports/cache";
import { loadCompetitionPolicy } from "@/lib/sports/competitionRegistry";

export async function GET(_request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  // This route used to serve a standings table for ANY competition id,
  // including ones deliberately blocked in the app.
  const policy = await loadCompetitionPolicy();
  if (!policy.get(leagueId)?.is_active) {
    return NextResponse.json({ error: "competition_not_allowed" }, { status: 404 });
  }

  const provider = getSportsDataProvider();
  const { data, staleSince } = await getOrSetCache(
    sportsCacheKey("standings", leagueId),
    CACHE_TTL_SECONDS.standings,
    () => provider.getStandings(leagueId)
  );
  return NextResponse.json({ standings: data, stale_since: staleSince });
}
