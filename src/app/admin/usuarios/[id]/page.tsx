import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";

async function addNote(userId: string, formData: FormData) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect(`/admin/usuarios/${userId}`);

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  const adminClient = createAdminSupabaseClient();
  await adminClient.from("crm_notes").insert({ user_id: userId, author_admin_id: access.adminId, note });
  await logAudit({ actorId: access.adminId, action: "crm_note_added", entityType: "user", entityId: userId });
  revalidatePath(`/admin/usuarios/${userId}`);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireAdminSection("usuarios");
  const admin = createAdminSupabaseClient();

  const [{ data: user }, { data: profile }, { data: timeline }, { data: notes }] = await Promise.all([
    admin.from("users").select("*").eq("id", id).maybeSingle(),
    admin.from("user_profiles").select("*").eq("user_id", id).maybeSingle(),
    admin.from("crm_timeline_events").select("*").eq("user_id", id).order("occurred_at", { ascending: false }).limit(100),
    admin.from("crm_notes").select("*").eq("user_id", id).order("created_at", { ascending: false }),
  ]);

  if (!user) notFound();

  const { data: attributionRows } = await admin
    .from("attribution_data")
    .select("*")
    .eq("lead_id", user.lead_id)
    .order("created_at", { ascending: false });

  const firstTouch = attributionRows?.find((a) => a.touch_type === "first");
  const lastTouch = attributionRows?.find((a) => a.touch_type === "last");

  return (
    <div>
      <h1 className="text-xl font-bold text-white">{user.full_name}</h1>
      <p className="text-sm text-neutral-400">{user.email} • {user.phone}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="text-sm font-semibold text-neutral-200">Perfil</h2>
          <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
            <Row label="Lead ID" value={user.lead_id} />
            <Row label="Nivel de acesso" value={user.access_level} />
            <Row label="Status" value={user.status} />
            <Row label="Cadastrado em" value={new Date(user.created_at).toLocaleString("pt-BR")} />
            <Row label="Instalou o app" value={profile?.pwa_install_status ?? "not_requested"} />
            <Row label="Notificacoes" value={profile?.notification_permission ?? "not_requested"} />
          </dl>

          <h3 className="mt-4 text-sm font-semibold text-neutral-200">Atribuicao</h3>
          <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
            <Row label="Origem (1o toque)" value={firstTouch?.utm_source ?? "—"} />
            <Row label="Campanha (1o toque)" value={firstTouch?.utm_campaign ?? "—"} />
            <Row label="Origem (ultimo toque)" value={lastTouch?.utm_source ?? "—"} />
            <Row label="Campanha (ultimo toque)" value={lastTouch?.utm_campaign ?? "—"} />
          </dl>
        </section>

        <section className="card lg:col-span-1">
          <h2 className="text-sm font-semibold text-neutral-200">Timeline</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {timeline?.map((t) => (
              <li key={t.id} className="border-b border-neutral-800 pb-2">
                <p className="text-neutral-200">{t.description}</p>
                <p className="text-xs text-neutral-500">{new Date(t.occurred_at).toLocaleString("pt-BR")}</p>
              </li>
            ))}
            {(!timeline || timeline.length === 0) && <p className="text-neutral-500">Sem eventos ainda.</p>}
          </ul>
        </section>

        <section className="card lg:col-span-1">
          <h2 className="text-sm font-semibold text-neutral-200">Notas internas</h2>
          {canWrite(access, "usuarios") && (
            <form action={addNote.bind(null, id)} className="mt-2 flex flex-col gap-2">
              <textarea name="note" rows={3} className="input" placeholder="Adicionar nota..." />
              <button type="submit" className="btn-secondary self-start">
                Salvar nota
              </button>
            </form>
          )}
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {notes?.map((n) => (
              <li key={n.id} className="border-b border-neutral-800 pb-2 text-neutral-300">
                <p>{n.note}</p>
                <p className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-200">{value}</dd>
    </div>
  );
}
