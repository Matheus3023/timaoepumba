import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { recalculateAllScores } from "@/lib/scoring/compute";

const ACCESS_LEVEL_LABEL: Record<string, string> = {
  VISITOR: "Visitante",
  APP_USER: "Conta criada",
  REGISTERED_USER: "Cadastro confirmado",
  FTD_USER: "FTD confirmado",
  RESTRICTED_USER: "Restrito",
  ADMIN: "Administrador",
};

function scoreBadgeClass(total: number): string {
  if (total >= 80) return "bg-emerald-500/15 text-emerald-300";
  if (total >= 60) return "bg-yellow-500/15 text-yellow-300";
  if (total >= 40) return "bg-orange-500/15 text-orange-300";
  if (total >= 20) return "bg-neutral-700/40 text-neutral-300";
  return "bg-neutral-800 text-neutral-500";
}

async function recalculateScores() {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect("/admin/usuarios");
  const count = await recalculateAllScores();
  await logAudit({ actorId: access.adminId, action: "scores_recalculated", metadata: { count } });
  revalidatePath("/admin/usuarios");
}

export default async function AdminUsersPage() {
  const access = await requireAdminSection("usuarios");
  const admin = createAdminSupabaseClient();
  const { data: users } = await admin
    .from("users")
    .select("id, full_name, email, access_level, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = (users ?? []).map((u) => u.id);
  const { data: scores } = userIds.length
    ? await admin.from("user_scores").select("user_id, total_score").in("user_id", userIds)
    : { data: [] as { user_id: string; total_score: number }[] };
  const scoreById = new Map((scores ?? []).map((s) => [s.user_id, s.total_score]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-neutral-400">Ultimos 100 cadastros.</p>
        </div>
        {canWrite(access, "usuarios") && (
          <form action={recalculateScores}>
            <button type="submit" className="btn-secondary px-4 py-2 text-sm">
              Recalcular scores
            </button>
          </form>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => {
              const score = scoreById.get(u.id);
              return (
                <tr key={u.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/usuarios/${u.id}`} className="text-yellow-300">
                      {u.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-300">{u.email}</td>
                  <td className="px-4 py-2 text-neutral-300">{ACCESS_LEVEL_LABEL[u.access_level]}</td>
                  <td className="px-4 py-2">
                    {score === undefined ? (
                      <span className="text-neutral-600">—</span>
                    ) : (
                      <span className={`badge ${scoreBadgeClass(score)}`}>{score}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{new Date(u.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
