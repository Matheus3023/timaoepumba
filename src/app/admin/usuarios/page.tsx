import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ACCESS_LEVEL_LABEL: Record<string, string> = {
  VISITOR: "Visitante",
  APP_USER: "Conta criada",
  REGISTERED_USER: "Cadastro confirmado",
  FTD_USER: "FTD confirmado",
  RESTRICTED_USER: "Restrito",
  ADMIN: "Administrador",
};

export default async function AdminUsersPage() {
  const admin = createAdminSupabaseClient();
  const { data: users } = await admin
    .from("users")
    .select("id, full_name, email, access_level, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Usuarios</h1>
      <p className="text-sm text-neutral-400">Ultimos 100 cadastros.</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                <td className="px-4 py-2">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-yellow-300">
                    {u.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-300">{u.email}</td>
                <td className="px-4 py-2 text-neutral-300">{ACCESS_LEVEL_LABEL[u.access_level]}</td>
                <td className="px-4 py-2 text-neutral-500">{new Date(u.created_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
