import Link from "next/link";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache } from "@/lib/sports/cache";
import { MatchesFilterTabs } from "@/components/app/MatchesFilterTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Match } from "@/lib/sports/types";

const DAYS = [
  { offset: -1, label: "Ontem" },
  { offset: 0, label: "Hoje" },
  { offset: 1, label: "Amanha" },
];

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day: dayParam } = await searchParams;
  const day = DAYS.some((d) => String(d.offset) === dayParam) ? Number(dayParam) : 0;

  const provider = getSportsDataProvider();
  const [{ data: matches }, { data: liveMatches }] = await Promise.all([
    day === 0
      ? getOrSetCache("today_matches", CACHE_TTL_SECONDS.todayMatches, () => provider.getTodayMatches())
      : getOrSetCache(`matches_day_${day}`, CACHE_TTL_SECONDS.otherDayMatches, () => provider.getMatchesForDay(day)),
    day === 0
      ? getOrSetCache("live_matches", CACHE_TTL_SECONDS.liveMatches, () => provider.getLiveMatches())
      : Promise.resolve({ data: [] as Match[] }),
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
      <PageHeader title="Jogos" />

      <div className="mt-3 flex gap-1.5">
        {DAYS.map((d) => (
          <Link
            key={d.offset}
            href={`/jogos?day=${d.offset}`}
            className={`flex-1 rounded-xl py-1.5 text-center text-sm font-medium transition ${
              day === d.offset ? "bg-neutral-100 text-neutral-900" : "bg-neutral-900 text-neutral-400"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      <MatchesFilterTabs liveMatches={liveMatches} groupedUpcoming={Object.entries(grouped)} showLiveTab={day === 0} />
    </div>
  );
}
