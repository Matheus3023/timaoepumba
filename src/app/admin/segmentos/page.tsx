import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { resolveSegmentUserIds } from "@/lib/segments/evaluate";
import type { SegmentCondition } from "@/lib/segments/types";
import { SegmentBuilderForm } from "@/components/admin/SegmentBuilderForm";

async function createSegment(formData: FormData) {
  "use server";
  const access = await requireAdminSection("segmentos");
  if (!canWrite(access, "segmentos")) redirect("/admin/segmentos");

  const types = formData.getAll("condition_type").map(String);
  const values = formData.getAll("condition_value").map(String);
  const definition: SegmentCondition[] = types.map((type, i) => ({
    type: type as SegmentCondition["type"],
    value: values[i] || undefined,
  }));

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("crm_segments")
    .insert({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      definition,
      created_by: access.adminId,
    })
    .select("id")
    .single();

  if (data) {
    await logAudit({ actorId: access.adminId, action: "segment_created", entityType: "crm_segment", entityId: data.id });
  }

  revalidatePath("/admin/segmentos");
}

async function deleteSegment(segmentId: string) {
  "use server";
  const access = await requireAdminSection("segmentos");
  if (!canWrite(access, "segmentos")) redirect("/admin/segmentos");

  const admin = createAdminSupabaseClient();
  await admin.from("crm_segments").delete().eq("id", segmentId);
  await logAudit({ actorId: access.adminId, action: "segment_deleted", entityType: "crm_segment", entityId: segmentId });
  revalidatePath("/admin/segmentos");
}

export default async function AdminSegmentsPage() {
  const access = await requireAdminSection("segmentos");
  const writable = canWrite(access, "segmentos");
  const admin = createAdminSupabaseClient();
  const { data: segments } = await admin.from("crm_segments").select("*").order("created_at", { ascending: false });

  const counts = await Promise.all(
    (segments ?? []).map(async (s) => ({
      id: s.id,
      count: (await resolveSegmentUserIds(((s.definition as SegmentCondition[]) ?? []))).length,
    }))
  );
  const countById = new Map(counts.map((c) => [c.id, c.count]));

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-white">Segmentos</h1>
      <p className="text-sm text-secondary">
        Grupos dinamicos de usuarios, recalculados a cada uso, para mirar campanhas de push em vez de mandar para
        toda a base.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {segments?.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{s.name}</p>
              {s.description && <p className="text-xs text-muted">{s.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-surface-elevated text-body">{countById.get(s.id) ?? 0} usuarios</span>
              {writable && (
                <form action={deleteSegment.bind(null, s.id)}>
                  <button type="submit" className="btn-secondary px-3 py-1.5 text-xs text-red-400">
                    Excluir
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {(!segments || segments.length === 0) && (
          <p className="card text-sm text-muted">Nenhum segmento criado — campanhas usam todos os usuarios ativos.</p>
        )}
      </div>

      {writable && <SegmentBuilderForm action={createSegment} />}
    </div>
  );
}
