import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportsDataProvider } from "@/lib/sports";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { MatchDetailTabs } from "@/components/app/MatchDetailTabs";
import { ArrowLeftIcon } from "@/components/icons";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = getSportsDataProvider();

  let match;
  try {
    match = await provider.getMatchDetails(id);
  } catch {
    notFound();
  }

  const [h2h, standings] = await Promise.all([
    provider.getHeadToHead(id).catch(() => []),
    provider.getStandingsForMatch(id).catch(() => []),
  ]);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await trackServerEvent({ eventName: "MatchViewed", userId: user?.id, properties: { match_id: id } });

  const kickoffLabel =
    match.status === "live"
      ? `Ao vivo${match.minute ? ` • ${match.minute}'` : ""}`
      : match.status === "finished"
        ? `Encerrado • ${new Date(match.kickoffAt).toLocaleDateString("pt-BR")}`
        : new Date(match.kickoffAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link href="/jogos" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200">
        <ArrowLeftIcon width={16} height={16} />
        Voltar
      </Link>

      <div className="card-glow mt-3">
        <p className="text-center text-xs text-neutral-500">{match.league.name}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <TeamAvatar name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} size={44} />
            <p className="text-sm font-medium text-white">{match.homeTeam.name}</p>
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-2xl font-bold text-white">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </p>
            <span
              className={`badge ${
                match.status === "live" ? "bg-red-500/15 text-red-300" : "bg-neutral-700/40 text-neutral-300"
              }`}
            >
              {match.status === "live" && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400 align-middle" />}
              {kickoffLabel}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <TeamAvatar name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} size={44} />
            <p className="text-sm font-medium text-white">{match.awayTeam.name}</p>
          </div>
        </div>
      </div>

      <MatchDetailTabs
        kickoffLabel={new Date(match.kickoffAt).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}
        competition={match.league.name}
        events={match.events}
        statistics={match.statistics ?? {}}
        standings={standings}
        homeTeamName={match.homeTeam.name}
        awayTeamName={match.awayTeam.name}
        h2h={h2h}
      />
    </div>
  );
}
