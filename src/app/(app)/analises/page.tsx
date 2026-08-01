import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { accessLevelSatisfies } from "@/lib/entitlements/rules";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

const RISK_LABEL: Record<string, string> = { baixo: "Risco baixo", medio: "Risco medio", alto: "Risco alto" };

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
      <PageHeader title="Analises" description="Conteudo publicado pela equipe de analistas." />

      <div className="mt-4 flex flex-col gap-3">
        {(!analyses || analyses.length === 0) && (
          <EmptyState title="Nenhuma analise publicada ainda" description="Volte em breve para conferir novas analises." />
        )}

        {analyses?.map((analysis) => {
          const unlocked = accessLevelSatisfies(accessLevel, analysis.min_access_level);
          return (
            <Link
              key={analysis.id}
              href={unlocked ? `/analises/${analysis.id}` : "/home"}
              className="card block"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{analysis.title}</p>
                {!unlocked && <span className="badge bg-neutral-700/50 text-neutral-300">🔒</span>}
              </div>
              {analysis.summary && <p className="mt-1 text-sm text-neutral-400">{analysis.summary}</p>}
              <div className="mt-2 flex gap-2 text-xs text-neutral-500">
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
