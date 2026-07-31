import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache } from "@/lib/sports/cache";
import { MatchRow } from "@/components/app/MatchRow";
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
      <p className="text-sm text-neutral-400">Direto da API, atualizado em tempo real.</p>

      {liveMatches.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-200">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-500" />
            Ao vivo
          </h2>
          <div className="flex flex-col gap-2">
            {liveMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {Object.entries(grouped).map(([league, leagueMatches]) => (
        <section key={league} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-200">{league}</h2>
          <div className="flex flex-col gap-2">
            {leagueMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}

      {matches.length === 0 && liveMatches.length === 0 && (
        <p className="card mt-4 text-sm text-neutral-500">Nenhum jogo cadastrado para hoje.</p>
      )}
    </div>
  );
}
