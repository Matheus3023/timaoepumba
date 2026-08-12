import { notFound } from "next/navigation";
import { getSportsDataProvider } from "@/lib/sports";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { MatchDetailTabs } from "@/components/app/MatchDetailTabs";
import { BackButton } from "@/components/ui/BackButton";
import { getHouseOddsForMatch, sortMarketsForDisplay } from "@/lib/odds/matchHouseOdds";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = getSportsDataProvider();

  let match;
  try {
    match = await provider.getMatchDetails(id);
  } catch {
    notFound();
  }

  const [h2h, standings, homeTeamRecent, awayTeamRecent, lineups, momentum, houseOdds] = await Promise.all([
    provider.getHeadToHead(id).catch(() => []),
    provider.getStandingsForMatch(id).catch(() => []),
    provider.getTeamRecentMatches(match.homeTeam.id, 5).catch(() => []),
    provider.getTeamRecentMatches(match.awayTeam.id, 5).catch(() => []),
    provider.getMatchLineups(id).catch(() => []),
    provider.getMatchMomentum(id).catch(() => []),
    // A casa e fonte externa e opcional: `getHouseOddsForMatch` nunca lanca,
    // entao a tela abre igual se o sportsbook estiver fora do ar.
    getHouseOddsForMatch(match),
  ]);

  const houseMarkets = houseOdds ? sortMarketsForDisplay(houseOdds) : [];
  const houseEventId = houseOdds?.providerEventId ?? "";
  const houseName = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";

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
      <BackButton fallbackHref="/jogos" />

      <div className="card-glow mt-3">
        <p className="text-center text-xs text-muted">{match.league.name}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <TeamAvatar name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} size={52} />
            <p className="text-sm font-semibold leading-tight text-white">{match.homeTeam.name}</p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1.5 px-2">
            {/* Tabular numerals so a 1 vs 2-digit score doesn't shift the
                score block sideways as it updates live. */}
            <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
              {match.homeScore ?? 0}
              <span className="mx-1 text-faint">-</span>
              {match.awayScore ?? 0}
            </p>
            <span
              className={`badge ${
                match.status === "live" ? "bg-red-500/15 text-red-300" : "bg-surface-highlighted/40 text-body"
              }`}
            >
              {match.status === "live" && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400 align-middle" />}
              {kickoffLabel}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <TeamAvatar name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} size={52} />
            <p className="text-sm font-semibold leading-tight text-white">{match.awayTeam.name}</p>
          </div>
        </div>

        {match.odds && match.status !== "finished" && (
          <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
            <OddsBlock label="Casa" value={match.odds.home} />
            <OddsBlock label="Empate" value={match.odds.draw} />
            <OddsBlock label="Fora" value={match.odds.away} />
          </div>
        )}
      </div>

      <MatchDetailTabs
        kickoffLabel={new Date(match.kickoffAt).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}
        competition={match.league.name}
        events={match.events}
        statistics={match.statistics ?? {}}
        standings={standings}
        homeTeamId={match.homeTeam.id}
        awayTeamId={match.awayTeam.id}
        homeTeamName={match.homeTeam.name}
        awayTeamName={match.awayTeam.name}
        h2h={h2h}
        homeTeamRecent={homeTeamRecent}
        awayTeamRecent={awayTeamRecent}
        lineups={lineups}
        momentum={momentum}
        houseMarkets={houseMarkets}
        houseName={houseName}
        houseEventId={houseEventId}
      />
    </div>
  );
}

function OddsBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-white/[0.04] bg-surface/60 py-2">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm font-bold tabular-nums text-white">{value.toFixed(2)}</span>
    </div>
  );
}
