import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessLevelSatisfies } from "@/lib/entitlements/rules";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

const RISK_LABEL: Record<string, string> = { baixo: "Risco baixo", medio: "Risco médio", alto: "Risco alto" };

export default async function AnalysesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: appUser }, { data: analyses }] = await Promise.all([
    supabase.from("users").select("access_level").eq("id", user!.id).single(),
    supabase
      .from("analyses")
      .select("id, title, summary, risk_level, min_access_level, market")
      .eq("status", "published")
      .order("publish_at", { ascending: false }),
  ]);

  const accessLevel = appUser?.access_level ?? "APP_USER";

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <PageHeader title="Análises" description="Conteúdo publicado pela equipe de analistas." />

      <Link href="/analises/funil" className="card-glow card-interactive mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">🔥 Funil ao vivo</p>
          <p className="text-xs text-secondary">
            Análise automática das partidas em andamento, critério por critério.
          </p>
        </div>
        <span className="text-muted">→</span>
      </Link>

      <div className="mt-4 flex flex-col gap-3">
        {(!analyses || analyses.length === 0) && (
          <EmptyState title="Nenhuma análise publicada ainda" description="Volte em breve para conferir novas análises." />
        )}

        {analyses?.map((analysis) => {
          const unlocked = accessLevelSatisfies(accessLevel, analysis.min_access_level);
          return (
            <Link
              key={analysis.id}
              href={unlocked ? `/analises/${analysis.id}` : "/home"}
              className="card card-interactive block"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug text-white">{analysis.title}</p>
                {!unlocked && <span className="badge shrink-0 bg-surface-highlighted/50 text-body">🔒</span>}
              </div>
              {analysis.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">{analysis.summary}</p>}
              <div className="mt-2 flex gap-2 text-xs text-muted">
                {analysis.market && <span>{analysis.market}</span>}
                {analysis.risk_level && <span>{RISK_LABEL[analysis.risk_level]}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
