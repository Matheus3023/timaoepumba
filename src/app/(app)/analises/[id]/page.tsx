import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { accessLevelSatisfies } from "@/lib/entitlements/rules";
import { trackServerEvent } from "@/lib/tracking/events";
import { BackButton } from "@/components/ui/BackButton";

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: appUser }, { data: analysis }] = await Promise.all([
    supabase.from("users").select("access_level").eq("id", user!.id).single(),
    supabase.from("analyses").select("*").eq("id", id).eq("status", "published").maybeSingle(),
  ]);

  if (!analysis) notFound();

  const accessLevel = appUser?.access_level ?? "APP_USER";
  if (!accessLevelSatisfies(accessLevel, analysis.min_access_level)) {
    redirect("/analises");
  }

  const admin = createAdminSupabaseClient();
  await Promise.all([
    admin.from("analysis_views").insert({ analysis_id: id, user_id: user!.id, source: "direct" }),
    trackServerEvent({ eventName: "AnalysisViewed", userId: user!.id, properties: { analysis_id: id } }),
  ]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <BackButton fallbackHref="/analises" className="mb-3" />

      {analysis.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={analysis.image_url} alt={analysis.title} className="mb-4 w-full rounded-xl object-cover" />
      )}
      <p className="text-xs text-muted">{analysis.market ?? "Analise"}</p>
      <h1 className="mt-1 text-xl font-bold text-white">{analysis.title}</h1>
      {analysis.summary && <p className="mt-2 text-sm text-secondary">{analysis.summary}</p>}

      <div className="card mt-4 whitespace-pre-line text-sm text-body">
        {analysis.description ?? "Sem conteudo adicional."}
      </div>

      <p className="mt-4 text-xs text-faint">
        Conteudo informativo, sem garantia de resultado. Aposte com responsabilidade.
      </p>
    </div>
  );
}
