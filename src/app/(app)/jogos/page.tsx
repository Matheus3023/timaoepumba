import Link from "next/link";
import { getSportsDataProvider } from "@/lib/sports";

export default async function MatchesPage() {
  const provider = getSportsDataProvider();
  const matches = await provider.getTodayMatches();

  const grouped = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.league.name;
    acc[key] = acc[key] ? [...acc[key], match] : [match];
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Jogos de hoje</h1>

      {Object.entries(grouped).map(([league, leagueMatches]) => (
        <section key={league} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-200">{league}</h2>
          <div className="flex flex-col gap-2">
            {leagueMatches.map((match) => (
              <Link key={match.id} href={`/jogos/${match.id}`} className="card flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </p>
                {match.status === "live" ? (
                  <span className="badge bg-red-500/20 text-red-300">
                    {match.homeScore}-{match.awayScore}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">
                    {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      {matches.length === 0 && <p className="card mt-4 text-sm text-neutral-500">Nenhum jogo cadastrado para hoje.</p>}
    </div>
  );
}
