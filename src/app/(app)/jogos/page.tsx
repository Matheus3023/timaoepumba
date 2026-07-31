import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache } from "@/lib/sports/cache";
import { MatchesFilterTabs } from "@/components/app/MatchesFilterTabs";
import type { Match } from "@/lib/sports/types";

export default async function MatchesPage() {
  const provider = getSportsDataProvider();
  const [{ data: matches }, { data: liveMatches }] = await Promise.all([
    getOrSetCache("today_matches", CACHE_TTL_SECONDS.todayMatches, () => provider.getTodayMatches()),
    getOrSetCache("live_matches", CACHE_TTL_SECONDS.liveMatches, () => provider.getLiveMatches()),
  ]);

  const liveIds = new Set(liveMatches.map((m) => m.id));
  const upcoming = matches.filter((m) => !liveIds.has(m.id));

  const grouped = upcoming.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.league.name;
    acc[key] = acc[key] ? [...acc[key], match] : [match];
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Jogos de hoje</h1>
      <MatchesFilterTabs liveMatches={liveMatches} groupedUpcoming={Object.entries(grouped)} />
    </div>
  );
}
