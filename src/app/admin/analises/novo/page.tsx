import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AccessLevel } from "@/types/database";

async function createAnalysis(formData: FormData) {
  "use server";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminSupabaseClient();
  const status = String(formData.get("action")) === "publish" ? "published" : "draft";

  const { data } = await admin
    .from("analyses")
    .insert({
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      market: String(formData.get("market") ?? "") || null,
      risk_level: String(formData.get("risk_level") ?? "") || null,
      min_access_level: String(formData.get("min_access_level") ?? "REGISTERED_USER") as AccessLevel,
      status,
      publish_at: status === "published" ? new Date().toISOString() : null,
      created_by: user?.id ?? null,
      responsible_admin_id: user?.id ?? null,
    })
    .select("id")
    .single();

  redirect(data ? "/admin/analises" : "/admin/analises/novo");
}

export default function NewAnalysisPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white">Nova analise</h1>
      <p className="text-sm text-neutral-400">
        A publicacao e sempre manual — a API de dados esportivos nunca publica analises automaticamente.
      </p>

      <form action={createAnalysis} className="mt-4 flex flex-col gap-3">
        <input name="title" required placeholder="Titulo" className="input" />
        <input name="summary" placeholder="Resumo" className="input" />
        <textarea name="description" rows={5} placeholder="Conteudo completo" className="input" />
        <input name="market" placeholder="Mercado analisado" className="input" />

        <select name="risk_level" className="input" defaultValue="medio">
          <option value="baixo">Risco baixo</option>
          <option value="medio">Risco medio</option>
          <option value="alto">Risco alto</option>
        </select>

        <select name="min_access_level" className="input" defaultValue="REGISTERED_USER">
          <option value="REGISTERED_USER">Cadastro confirmado</option>
          <option value="FTD_USER">FTD confirmado</option>
        </select>

        <div className="mt-2 flex gap-3">
          <button type="submit" name="action" value="draft" className="btn-secondary">
            Salvar rascunho
          </button>
          <button type="submit" name="action" value="publish" className="btn-primary">
            Publicar agora
          </button>
        </div>
      </form>
    </div>
  );
}
