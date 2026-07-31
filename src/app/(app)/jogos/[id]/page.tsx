import { notFound } from "next/navigation";
import { getSportsDataProvider } from "@/lib/sports";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const EVENT_LABEL: Record<string, string> = {
  goal: "⚽ Gol",
  yellow_card: "🟨 Cartao amarelo",
  red_card: "🟥 Cartao vermelho",
  substitution: "🔄 Substituicao",
  var: "📺 VAR",
};

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = getSportsDataProvider();

  let match;
  try {
    match = await provider.getMatchDetails(id);
  } catch {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await trackServerEvent({ eventName: "MatchViewed", userId: user?.id, properties: { match_id: id } });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <p className="text-xs text-neutral-500">{match.league.name}</p>
      <h1 className="mt-1 text-lg font-bold text-white">
        {match.homeTeam.name} {match.homeScore ?? 0} - {match.awayScore ?? 0} {match.awayTeam.name}
      </h1>
      <p className="mt-1 text-sm text-neutral-400">
        {match.status === "live"
          ? `Ao vivo • ${match.minute}'`
          : new Date(match.kickoffAt).toLocaleString("pt-BR")}
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Eventos da partida</h2>
        {match.events.length === 0 && <p className="card text-sm text-neutral-500">Sem eventos registrados.</p>}
        <ul className="flex flex-col gap-2">
          {match.events.map((event) => (
            <li key={event.id} className="card flex items-center justify-between text-sm">
              <span className="text-neutral-300">
                {EVENT_LABEL[event.type] ?? event.type} {event.playerName && `— ${event.playerName}`}
              </span>
              <span className="text-neutral-500">{event.minute}&apos;</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
