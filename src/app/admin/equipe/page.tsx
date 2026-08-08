import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { logAudit } from "@/lib/admin/audit";

async function assignRole(formData: FormData) {
  "use server";

  const access = await requireAdminSection("equipe");
  const targetUserId = String(formData.get("user_id") ?? "");
  const roleId = String(formData.get("role_id") ?? "");
  if (!targetUserId) return;

  const admin = createAdminSupabaseClient();

  // One profile per admin: clear any existing assignment before setting the new one.
  await admin.from("user_roles").delete().eq("user_id", targetUserId);
  if (roleId) {
    await admin.from("user_roles").insert({ user_id: targetUserId, role_id: roleId });
  }

  await logAudit({
    actorId: access.adminId,
    action: roleId ? "admin_role_assigned" : "admin_role_removed",
    entityType: "user",
    entityId: targetUserId,
    metadata: { role_id: roleId || null },
  });

  revalidatePath("/admin/equipe");
}

export default async function AdminTeamPage() {
  await requireAdminSection("equipe");
  const admin = createAdminSupabaseClient();

  const [{ data: adminUsers }, { data: roles }, { data: userRoles }] = await Promise.all([
    admin.from("users").select("id, full_name, email").eq("access_level", "ADMIN").order("full_name"),
    admin.from("roles").select("id, name, admin_profile").order("name"),
    admin.from("user_roles").select("user_id, role_id"),
  ]);

  const roleIdByUser = new Map((userRoles ?? []).map((r) => [r.user_id, r.role_id]));
  const roleById = new Map((roles ?? []).map((r) => [r.id, r]));

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        eyebrow="Sistema"
        title="Equipe"
        description="Define o perfil administrativo de cada conta ADMIN. Uma conta sem perfil atribuído tem acesso total, igual a um Administrador — atribua um perfil para restringir o que ela pode ver e alterar no painel."
      />

      <div className="mt-4 flex flex-col gap-2">
        {adminUsers?.map((u) => {
          const currentRoleId = roleIdByUser.get(u.id);
          const currentRole = currentRoleId ? roleById.get(currentRoleId) : null;
          return (
            <form key={u.id} action={assignRole} className="card flex items-center justify-between gap-3">
              <input type="hidden" name="user_id" value={u.id} />
              <div>
                <p className="text-sm font-medium text-white">{u.full_name ?? u.email}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select name="role_id" defaultValue={currentRoleId ?? ""} className="input text-sm">
                  <option value="">Acesso total (sem perfil)</option>
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                  Salvar
                </button>
              </div>
              {currentRole && (
                <span className="badge shrink-0 bg-surface-elevated text-body">{currentRole.name}</span>
              )}
            </form>
          );
        })}
        {(!adminUsers || adminUsers.length === 0) && (
          <p className="card text-sm text-muted">Nenhuma conta com access_level ADMIN encontrada.</p>
        )}
      </div>
    </div>
  );
}
