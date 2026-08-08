import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { computeAndSaveUserScore } from "@/lib/scoring/compute";
import { UserProfileTabs } from "@/components/admin/UserProfileTabs";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Stat, StatStrip } from "@/components/admin/StatStrip";
import { ACCESS_LEVEL_LABEL } from "@/components/admin/Badges";
import { formatRelative } from "@/components/admin/format";
import { BackButton } from "@/components/ui/BackButton";

async function addNote(userId: string, formData: FormData) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect(`/admin/usuarios/${userId}`);

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  const admin = createAdminSupabaseClient();
  await admin.from("crm_notes").insert({ user_id: userId, author_admin_id: access.adminId, note });
  await logAudit({ actorId: access.adminId, action: "crm_note_added", entityType: "user", entityId: userId });
  revalidatePath(`/admin/usuarios/${userId}`);
}

async function addTask(userId: string, formData: FormData) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect(`/admin/usuarios/${userId}`);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const dueAt = String(formData.get("due_at") ?? "") || null;

  const admin = createAdminSupabaseClient();
  await admin.from("crm_tasks").insert({ user_id: userId, assigned_admin_id: access.adminId, title, due_at: dueAt });
  await logAudit({ actorId: access.adminId, action: "crm_task_created", entityType: "user", entityId: userId });
  revalidatePath(`/admin/usuarios/${userId}`);
}

async function completeTask(userId: string, taskId: string) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect(`/admin/usuarios/${userId}`);

  const admin = createAdminSupabaseClient();
  await admin.from("crm_tasks").update({ status: "done" }).eq("id", taskId);
  revalidatePath(`/admin/usuarios/${userId}`);
}

async function recalculateScore(userId: string) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect(`/admin/usuarios/${userId}`);

  await computeAndSaveUserScore(userId);
  await logAudit({ actorId: access.adminId, action: "score_recalculated", entityType: "user", entityId: userId });
  revalidatePath(`/admin/usuarios/${userId}`);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireAdminSection("usuarios");
  const writable = canWrite(access, "usuarios");
  const admin = createAdminSupabaseClient();

  const [
    { data: user },
    { data: profile },
    { data: timeline },
    { data: notes },
    { data: tasks },
    { data: score },
    { data: crmStatus },
    { data: registration },
    { data: ftd },
    { data: clicks },
    { data: communityMemberships },
    { data: messages },
    { data: pushDeliveries },
    { data: consents },
    { data: optOut },
    { data: auditLogs },
  ] = await Promise.all([
    admin.from("users").select("*").eq("id", id).maybeSingle(),
    admin.from("user_profiles").select("*").eq("user_id", id).maybeSingle(),
    admin.from("crm_timeline_events").select("*").eq("user_id", id).order("occurred_at", { ascending: false }).limit(100),
    admin.from("crm_notes").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("crm_tasks").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("user_scores").select("*").eq("user_id", id).maybeSingle(),
    admin.from("crm_user_status").select("stage_id, moved_at").eq("user_id", id).maybeSingle(),
    admin.from("registrations").select("confirmed_at").eq("user_id", id).maybeSingle(),
    admin.from("ftds").select("confirmed_at").eq("user_id", id).maybeSingle(),
    admin.from("affiliate_clicks").select("id, clicked_at").eq("user_id", id).order("clicked_at", { ascending: false }),
    admin.from("community_members").select("room_id, role, joined_at").eq("user_id", id),
    admin.from("community_messages").select("id, content, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    admin
      .from("push_deliveries")
      .select("id, status, sent_at, opened_at, clicked_at, failure_reason")
      .eq("user_id", id)
      .order("sent_at", { ascending: false })
      .limit(30),
    admin.from("consents").select("*").eq("user_id", id).order("granted_at", { ascending: false }),
    admin.from("marketing_optouts").select("*").eq("user_id", id).maybeSingle(),
    admin.from("audit_logs").select("*").eq("entity_type", "user").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  if (!user) notFound();

  const { data: attributionRows } = await admin
    .from("attribution_data")
    .select("*")
    .eq("lead_id", user.lead_id)
    .order("created_at", { ascending: false });

  const stageName = crmStatus?.stage_id
    ? (await admin.from("crm_stages").select("name").eq("id", crmStatus.stage_id).maybeSingle()).data?.name ?? null
    : null;

  const roomIds = [...new Set((communityMemberships ?? []).map((m) => m.room_id))];
  const { data: rooms } = roomIds.length
    ? await admin.from("community_rooms").select("id, name").in("id", roomIds)
    : { data: [] as { id: string; name: string }[] };
  const roomNameById = new Map((rooms ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="flex flex-col gap-4">
      <BackButton fallbackHref="/admin/usuarios" className="-mb-1" />

      <AdminPageHeader
        eyebrow="Pessoas · Ficha do usuário"
        title={user.full_name?.trim() || user.email}
        description={[user.email, user.phone].filter(Boolean).join(" · ")}
        actions={
          writable ? (
            <form action={recalculateScore.bind(null, id)}>
              <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                Recalcular score
              </button>
            </form>
          ) : (
            <span className="badge bg-surface-elevated text-muted">Somente leitura</span>
          )
        }
      />

      {/* O que o suporte precisa saber antes de abrir qualquer aba: quanto
          vale, em que etapa está, se pode ser contatado e quando apareceu
          por último. */}
      <StatStrip>
        <Stat label="Lead score" value={score ? score.total_score : "—"} hint="de 100" tone="accent" />
        <Stat label="Etapa" value={ACCESS_LEVEL_LABEL[user.access_level] ?? user.access_level} />
        <Stat label="Situação" value={user.status === "active" ? "Ativo" : user.status} />
        <Stat
          label="Último acesso"
          value={profile?.last_seen_at ? formatRelative(profile.last_seen_at) : "nunca"}
        />
        <Stat label="Cliques na casa" value={clicks?.length ?? 0} />
        <Stat label="FTD" value={ftd?.confirmed_at ? "Confirmado" : "Não"} />
      </StatStrip>

      <UserProfileTabs
        user={{
          lead_id: user.lead_id,
          access_level: user.access_level,
          status: user.status,
          created_at: user.created_at,
          date_of_birth: user.date_of_birth,
        }}
        profile={
          profile
            ? {
                pwa_install_status: profile.pwa_install_status,
                pwa_installed_at: profile.pwa_installed_at,
                notification_permission: profile.notification_permission,
                last_seen_at: profile.last_seen_at,
                last_device: profile.last_device,
                last_browser: profile.last_browser,
                last_os: profile.last_os,
                onboarding_completed: profile.onboarding_completed,
                favorite_team_id: profile.favorite_team_id,
              }
            : null
        }
        score={
          score
            ? {
                intent_score: score.intent_score,
                engagement_score: score.engagement_score,
                relationship_score: score.relationship_score,
                total_score: score.total_score,
                risk_blocked: score.risk_blocked,
                risk_reason: score.risk_reason,
                calculated_at: score.calculated_at,
              }
            : null
        }
        stageName={stageName}
        firstTouch={attributionRows?.find((a) => a.touch_type === "first") ?? null}
        lastTouch={attributionRows?.find((a) => a.touch_type === "last") ?? null}
        timeline={(timeline ?? []).map((t) => ({ id: t.id, description: t.description, occurred_at: t.occurred_at }))}
        conversion={{
          clicks: (clicks ?? []).map((c) => ({ id: c.id, clicked_at: c.clicked_at })),
          registrationConfirmedAt: registration?.confirmed_at ?? null,
          ftdConfirmedAt: ftd?.confirmed_at ?? null,
        }}
        community={{
          rooms: (communityMemberships ?? []).map((m) => ({
            room_name: roomNameById.get(m.room_id) ?? "—",
            role: m.role,
            joined_at: m.joined_at,
          })),
          messages: (messages ?? []).map((m) => ({ id: m.id, content: m.content, created_at: m.created_at })),
        }}
        pushDeliveries={(pushDeliveries ?? []).map((d) => ({
          id: d.id,
          status: d.status,
          sent_at: d.sent_at,
          opened_at: d.opened_at,
          clicked_at: d.clicked_at,
          failure_reason: d.failure_reason,
        }))}
        privacy={{
          consents: (consents ?? []).map((c) => ({
            consent_type: c.consent_type,
            granted: c.granted,
            version: c.version,
            granted_at: c.granted_at,
          })),
          optedOutAt: optOut?.opted_out_at ?? null,
        }}
        auditLogs={(auditLogs ?? []).map((a) => ({ id: a.id, action: a.action, created_at: a.created_at }))}
        notes={(notes ?? []).map((n) => ({ id: n.id, note: n.note, created_at: n.created_at }))}
        tasks={(tasks ?? []).map((t) => ({ id: t.id, title: t.title, status: t.status, due_at: t.due_at }))}
        writable={writable}
        addNoteAction={addNote.bind(null, id)}
        addTaskAction={addTask.bind(null, id)}
        completeTaskAction={completeTask.bind(null, id)}
      />
    </div>
  );
}
