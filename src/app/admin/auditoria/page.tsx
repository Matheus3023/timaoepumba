import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";

const ACTOR_TYPE_LABEL: Record<string, string> = {
  admin: "Admin",
  system: "Sistema",
  user: "Usuario",
};

export default async function AdminAuditLogPage() {
  await requireAdminSection("auditoria");
  const admin = createAdminSupabaseClient();

  const { data: logs } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter((id): id is string => !!id))];
  const { data: actors } = actorIds.length
    ? await admin.from("users").select("id, full_name, email").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? a.email]));

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Auditoria</h1>
      <p className="text-sm text-secondary">Ultimas 200 acoes administrativas registradas (PRD sec. 37).</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-surface-elevated">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-secondary">
            <tr>
              <th className="px-4 py-2">Quando</th>
              <th className="px-4 py-2">Quem</th>
              <th className="px-4 py-2">Acao</th>
              <th className="px-4 py-2">Registro</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-t border-surface-elevated hover:bg-surface/50">
                <td className="whitespace-nowrap px-4 py-2 text-muted">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2 text-body">
                  {log.actor_id ? actorById.get(log.actor_id) ?? log.actor_id : ACTOR_TYPE_LABEL[log.actor_type] ?? log.actor_type}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-yellow-300">{log.action}</td>
                <td className="px-4 py-2 text-muted">
                  {log.entity_type ?? "—"} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Nenhuma acao registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
