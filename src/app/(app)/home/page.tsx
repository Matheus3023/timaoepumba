import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSportsDataProvider } from "@/lib/sports";
import { accessLevelSatisfies } from "@/lib/entitlements/rules";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: appUser }, { data: analyses }] = await Promise.all([
    supabase.from("user_profiles").select("favorite_leagues").eq("user_id", user!.id).maybeSingle(),
    supabase.from("users").select("full_name, access_level").eq("id", user!.id).single(),
    supabase
      .from("analyses")
      .select("id, title, summary, risk_level, min_access_level")
      .eq("status", "published")
      .order("publish_at", { ascending: false })
      .limit(3),
  ]);

  const provider = getSportsDataProvider();
  const [todayMatches, liveMatches] = await Promise.all([
    provider.getTodayMatches(),
    provider.getLiveMatches(),
  ]);

  const accessLevel = appUser?.access_level ?? "APP_USER";
  const registrationDone = accessLevel !== "APP_USER" && accessLevel !== "VISITOR";
  const communityUnlocked = accessLevelSatisfies(accessLevel, "REGISTERED_USER");
  const ftdDone = accessLevelSatisfies(accessLevel, "FTD_USER");

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Ola, {appUser?.full_name?.split(" ")[0] ?? "torcedor"}!</h1>
      <p className="text-sm text-neutral-400">Confira os jogos e novidades de hoje.</p>

      <section className="card mt-4">
        <h2 className="text-sm font-semibold text-neutral-200">Status da conta</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <StatusRow label="Conta no aplicativo" done />
          <StatusRow label="Cadastro na parceira" done={registrationDone} />
          <StatusRow label="Comunidade" done={communityUnlocked} />
          <StatusRow label="Recursos adicionais (FTD)" done={ftdDone} />
        </ul>
        {!registrationDone && (
          <a href="/api/affiliate/click" className="btn-primary mt-4 block text-center">
            Cadastrar na casa parceira
          </a>
        )}
      </section>

      {liveMatches.length > 0 && (
        <Section title="Jogos ao vivo">
          {liveMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </Section>
      )}

      <Section title="Jogos de hoje">
        {todayMatches.length === 0 && <EmptyState text="Nenhum jogo cadastrado para hoje." />}
        {todayMatches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </Section>

      <Section title="Analises recentes" action={{ href: "/analises", label: "Ver todas" }}>
        {(!analyses || analyses.length === 0) && <EmptyState text="Nenhuma analise publicada ainda." />}
        {analyses?.map((analysis) => (
          <Link key={analysis.id} href={`/analises/${analysis.id}`} className="card block">
            <p className="font-semibold text-white">{analysis.title}</p>
            {analysis.summary && <p className="mt-1 text-sm text-neutral-400">{analysis.summary}</p>}
          </Link>
        ))}
      </Section>

      <Section title="Comunidade" action={{ href: "/comunidade", label: "Entrar" }}>
        <p className="text-sm text-neutral-400">
          {communityUnlocked
            ? "Participe das salas por campeonato, reaja e comente com outros torcedores."
            : "Confirme seu cadastro na casa parceira para liberar a comunidade."}
        </p>
      </Section>

      <p className="mt-2 text-[11px] text-neutral-600">
        Favoritos salvos: {(profile?.favorite_leagues ?? []).length}
      </p>
    </div>
  );
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-neutral-300">{label}</span>
      <span className={`badge ${done ? "bg-green-500/20 text-green-300" : "bg-neutral-700/40 text-neutral-400"}`}>
        {done ? "concluido" : "pendente"}
      </span>
    </li>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
        {action && (
          <Link href={action.href} className="text-xs text-yellow-400">
            {action.label}
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="card text-sm text-neutral-500">{text}</p>;
}

function MatchRow({
  match,
}: {
  match: Awaited<ReturnType<ReturnType<typeof getSportsDataProvider>["getTodayMatches"]>>[number];
}) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-500">{match.league.name}</p>
        <p className="text-sm font-medium text-white">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </p>
      </div>
      <div className="text-right">
        {match.status === "live" ? (
          <span className="badge bg-red-500/20 text-red-300">
            {match.homeScore}-{match.awayScore} • {match.minute}&apos;
          </span>
        ) : (
          <span className="text-xs text-neutral-400">
            {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
