import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";

export default async function AdminPushPage() {
  const access = await requireAdminSection("push");
  const admin = createAdminSupabaseClient();
  const { data: campaigns } = await admin
    .from("push_campaigns")
    .select("id, internal_name, category, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Campanhas de push</h1>
        {canWrite(access, "push") && (
          <Link href="/admin/push/novo" className="btn-primary px-4 py-2 text-sm">
            Nova campanha
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {campaigns?.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{c.internal_name}</p>
              <p className="text-xs text-neutral-500">{c.category}</p>
            </div>
            <span className="badge bg-neutral-700/50 text-neutral-200">{c.status}</span>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <p className="card text-sm text-neutral-500">Nenhuma campanha criada.</p>
        )}
      </div>
    </div>
  );
}
