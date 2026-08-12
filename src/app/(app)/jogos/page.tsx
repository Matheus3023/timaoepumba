import Link from "next/link";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";
import { MatchesFilterTabs } from "@/components/app/MatchesFilterTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaleDataNotice } from "@/components/app/StaleDataNotice";
import { formatStaleAge } from "@/lib/sports/staleness";
import { loadCompetitionPriority, sortGroupsForDisplay, sortMatchesForDisplay } from "@/lib/sports/curation";
import type { Match } from "@/lib/sports/types";
import { filterToHouseCovered } from "@/lib/odds/houseCoverage";

const DAYS = [
  { offset: -1, label: "Ontem" },
  { offset: 0, label: "Hoje" },
  { offset: 1, label: "Amanha" },
];

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day: dayParam } = await searchParams;
  const day = DAYS.some((d) => String(d.offset) === dayParam) ? Number(dayParam) : 0;

  // Keys embed the real calendar date rather than a "today"/offset label,
  // so a list cached right before midnight can't keep being served under
  // the wrong day after the date rolls over.
  const provider = getSportsDataProvider();
  const [{ data: matches, staleSince }, { data: liveMatches }] = await Promise.all([
    day === 0
      ? getOrSetCache(sportsCacheKey("matches", sportsDayKey()), CACHE_TTL_SECONDS.todayMatches, () =>
          provider.getTodayMatches()
        )
      : getOrSetCache(sportsCacheKey("matches", sportsDayKey(day)), CACHE_TTL_SECONDS.otherDayMatches, () =>
          provider.getMatchesForDay(day)
        ),
    day === 0
      ? getOrSetCache(sportsCacheKey("live_matches", sportsDayKey()), CACHE_TTL_SECONDS.liveMatches, () =>
          provider.getLiveMatches()
        )
      : Promise.resolve({ data: [] as Match[] }),
  ]);

  // A casa decide o que aparece: jogo sem mercado nela nao gera aposta e so
  // ocupa a lista. `filterToHouseCovered` falha ABERTO — se o sportsbook
  // estiver fora do ar, a lista volta inteira em vez de esvaziar.
  const [cobertos, cobertosAoVivo] = await Promise.all([
    filterToHouseCovered(matches),
    filterToHouseCovered(liveMatches),
  ]);

  const liveIds = new Set(cobertosAoVivo.matches.map((m) => m.id));
  const upcoming = cobertos.matches.filter((m) => !liveIds.has(m.id));

  const grouped = upcoming.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.league.name;
    acc[key] = acc[key] ? [...acc[key], match] : [match];
    return acc;
  }, {});

  // As competicoes de maior peso sobem para o topo, em vez da ordem
  // alfabetica que vem do provedor.
  const { available, priority } = await loadCompetitionPriority();
  const orderedGroups = sortGroupsForDisplay(Object.entries(grouped), priority, available);
  const orderedLive = sortMatchesForDisplay(cobertosAoVivo.matches, priority, available);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <PageHeader title="Jogos" />

      <StaleDataNotice age={formatStaleAge(staleSince)} />

      {/* Segmented control: one recessed track with a single raised segment,
          instead of three separate buttons where the active one was a stark
          white block. */}
      <div className="mt-4 flex gap-1 rounded-2xl border border-white/[0.06] bg-surface/60 p-1">
        {DAYS.map((d) => (
          <Link
            key={d.offset}
            href={`/jogos?day=${d.offset}`}
            aria-current={day === d.offset ? "page" : undefined}
            className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition-colors ${
              day === d.offset
                ? "bg-neutral-100 text-surface shadow-sm"
                : "text-secondary hover:bg-white/[0.04] hover:text-strong"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      <MatchesFilterTabs liveMatches={orderedLive} groupedUpcoming={orderedGroups} showLiveTab={day === 0} />
    </div>
  );
}
