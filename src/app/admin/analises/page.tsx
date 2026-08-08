import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  in_review: "Em revisao",
  scheduled: "Agendado",
  published: "Publicado",
  closed: "Encerrado",
  canceled: "Cancelado",
};

export default async function AdminAnalysesPage() {
  const access = await requireAdminSection("analises");
  const admin = createAdminSupabaseClient();
  const { data: analyses } = await admin
    .from("analyses")
    .select("id, title, status, min_access_level, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Análises</h1>
        {canWrite(access, "analises") && (
          <Link href="/admin/analises/novo" className="btn-primary px-4 py-2 text-sm">
            Nova análise
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {analyses?.map((a) => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{a.title}</p>
              <p className="text-xs text-muted">Acesso minimo: {a.min_access_level}</p>
            </div>
            <span className="badge bg-surface-highlighted/50 text-strong">{STATUS_LABEL[a.status] ?? a.status}</span>
          </div>
        ))}
        {(!analyses || analyses.length === 0) && <p className="card text-sm text-muted">Nenhuma análise criada.</p>}
      </div>
    </div>
  );
}
