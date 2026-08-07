import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey } from "@/lib/sports/cache";
import { loadCompetitionPolicy } from "@/lib/sports/competitionRegistry";

export async function GET(_request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  // This route used to serve a standings table for ANY competition id,
  // including ones deliberately blocked in the app. Only enforced when the
  // allowlist is actually readable and populated — otherwise a pending
  // migration would 404 every competition instead of just the blocked ones.
  const { available, policy } = await loadCompetitionPolicy();
  const enforceable = available && policy.size > 0;
  if (enforceable && !policy.get(leagueId)?.is_active) {
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
