import Link from "next/link";
import type { Match } from "@/lib/sports/types";
import { TeamAvatar } from "@/components/app/TeamAvatar";

export function MatchRow({ match }: { match: Match }) {
  return (
    <Link href={`/jogos/${match.id}`} className="card flex items-center justify-between transition-transform hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <TeamAvatar name={match.homeTeam.name} />
          <TeamAvatar name={match.awayTeam.name} />
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{match.league.name}</p>
          <p className="text-sm font-medium text-white">
            {match.homeTeam.name} <span className="text-neutral-600">vs</span> {match.awayTeam.name}
          </p>
        </div>
      </div>
      <div className="text-right">
        {match.status === "live" ? (
          <span className="badge bg-red-500/15 text-red-300">
            {match.homeScore}-{match.awayScore} {match.minute ? `• ${match.minute}'` : ""}
          </span>
        ) : match.status === "finished" ? (
          <span className="badge bg-neutral-700/40 text-neutral-300">
            {match.homeScore}-{match.awayScore}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">
            {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </Link>
  );
}
