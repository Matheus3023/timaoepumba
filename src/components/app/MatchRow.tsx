import Link from "next/link";
import type { Match } from "@/lib/sports/types";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { LeagueBadge } from "@/components/app/LeagueBadge";

export function MatchRow({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeWon = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWon = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <Link
      href={`/jogos/${match.id}`}
      className={`relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border px-3.5 py-3 transition-transform hover:-translate-y-0.5 ${
        isLive ? "border-red-500/20 bg-red-500/[0.05]" : "border-white/5 bg-neutral-900/60"
      }`}
    >
      {isLive && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />}

      <div className="flex items-center justify-between gap-2 pl-1">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-500">
          <LeagueBadge name={match.league.name} logoUrl={match.league.logoUrl} size={14} />
          <span className="truncate">{match.league.name}</span>
        </div>

        {isLive ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400" />
            {match.minute ? `${match.minute}'` : "AO VIVO"}
          </span>
        ) : isFinished ? (
          <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-400">Encerrado</span>
        ) : (
          <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
            {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 pl-1">
        <TeamLine
          name={match.homeTeam.name}
          logoUrl={match.homeTeam.logoUrl}
          score={match.homeScore}
          showScore={isLive || isFinished}
          highlight={homeWon}
        />
        <TeamLine
          name={match.awayTeam.name}
          logoUrl={match.awayTeam.logoUrl}
          score={match.awayScore}
          showScore={isLive || isFinished}
          highlight={awayWon}
        />
      </div>
    </Link>
  );
}

function TeamLine({
  name,
  logoUrl,
  score,
  showScore,
  highlight,
}: {
  name: string;
  logoUrl?: string | null;
  score: number | null;
  showScore: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamAvatar name={name} logoUrl={logoUrl} size={26} />
      <span className={`min-w-0 flex-1 truncate text-sm ${highlight ? "font-semibold text-white" : "text-neutral-200"}`}>
        {name}
      </span>
      {showScore && (
        <span className={`text-sm ${highlight ? "font-bold text-white" : "font-semibold text-neutral-400"}`}>
          {score ?? 0}
        </span>
      )}
    </div>
  );
}
