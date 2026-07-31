import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { deleteMessage, muteUserInRoom, reviewReport } from "@/lib/moderation/actions";
import { restrictUser, accessLevelSatisfies } from "@/lib/entitlements/rules";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";

const LIVE_CHAT_SLUG = "resenha-geral";

async function forceUnlockLiveChat() {
  "use server";
  const access = await requireModerationWrite();
  const admin = createAdminSupabaseClient();

  const { data: room } = await admin.from("community_rooms").select("*").eq("slug", LIVE_CHAT_SLUG).maybeSingle();
  if (!room) {
    return;
  }

  const { data: allUsers } = await admin.from("users").select("id, access_level");
  const eligibleIds = (allUsers ?? [])
    .filter((u) => accessLevelSatisfies(u.access_level, room.min_access_level))
    .map((u) => u.id);

  if (eligibleIds.length > 0) {
    await admin.from("community_members").upsert(
      eligibleIds.map((userId) => ({ room_id: room.id, user_id: userId, role: "usuario" })),
      { onConflict: "room_id,user_id", ignoreDuplicates: true }
    );
  }

  await logAudit({
    actorId: access.adminId,
    action: "live_chat_force_unlocked",
    entityType: "community_room",
    entityId: room.id,
    metadata: { eligible_count: eligibleIds.length },
  });

  revalidatePath("/admin/comunidade");
}

async function requireModerationWrite() {
  const access = await requireAdminSection("comunidade");
  if (!canWrite(access, "comunidade")) redirect("/admin/comunidade");
  return access;
}

async function handleDismissReport(reportId: string) {
  "use server";
  const access = await requireModerationWrite();
  await reviewReport(reportId, "dismissed");
  await logAudit({ actorId: access.adminId, action: "report_dismissed", entityType: "message_report", entityId: reportId });
  revalidatePath("/admin/comunidade");
}

async function handleDeleteReportedMessage(reportId: string, messageId: string) {
  "use server";
  const access = await requireModerationWrite();
  await deleteMessage(messageId, access.adminId, "Denuncia da comunidade");
  await reviewReport(reportId, "reviewed");
  await logAudit({ actorId: access.adminId, action: "message_deleted", entityType: "community_message", entityId: messageId, metadata: { report_id: reportId } });
  revalidatePath("/admin/comunidade");
}

async function handleMuteAuthor(reportId: string, roomId: string, userId: string) {
  "use server";
  const access = await requireModerationWrite();
  await muteUserInRoom(roomId, userId, access.adminId, "Denuncia da comunidade");
  await reviewReport(reportId, "reviewed");
  await logAudit({ actorId: access.adminId, action: "user_muted", entityType: "user", entityId: userId, metadata: { room_id: roomId, report_id: reportId } });
  revalidatePath("/admin/comunidade");
}

async function handleRestrictUser(reportId: string, userId: string) {
  "use server";
  const access = await requireModerationWrite();
  await restrictUser(userId, "Denuncia da comunidade — conta bloqueada", access.adminId);
  await reviewReport(reportId, "reviewed");
  await logAudit({ actorId: access.adminId, action: "user_restricted", entityType: "user", entityId: userId, metadata: { report_id: reportId } });
  revalidatePath("/admin/comunidade");
}

async function addBannedWord(formData: FormData) {
  "use server";
  const access = await requireModerationWrite();
  const word = String(formData.get("word") ?? "").trim().toLowerCase();
  if (!word) return;
  const admin = createAdminSupabaseClient();
  await admin.from("banned_words").insert({ word });
  await logAudit({ actorId: access.adminId, action: "banned_word_added", entityType: "banned_word", metadata: { word } });
  revalidatePath("/admin/comunidade");
}

async function removeBannedWord(wordId: string) {
  "use server";
  const access = await requireModerationWrite();
  const admin = createAdminSupabaseClient();
  await admin.from("banned_words").delete().eq("id", wordId);
  await logAudit({ actorId: access.adminId, action: "banned_word_removed", entityType: "banned_word", entityId: wordId });
  revalidatePath("/admin/comunidade");
}

export default async function AdminCommunityModerationPage() {
  const access = await requireAdminSection("comunidade");
  const writable = canWrite(access, "comunidade");
  const admin = createAdminSupabaseClient();

  const [{ data: reports }, { data: bannedWords }, { data: recentActions }, { data: liveChatRoom }] = await Promise.all([
    admin.from("message_reports").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    admin.from("banned_words").select("*").order("word"),
    admin.from("moderation_actions").select("*").order("created_at", { ascending: false }).limit(30),
    admin.from("community_rooms").select("*").eq("slug", LIVE_CHAT_SLUG).maybeSingle(),
  ]);

  const [{ count: totalUsers }, { count: liveChatMembers }] = liveChatRoom
    ? await Promise.all([
        admin.from("users").select("id", { count: "exact", head: true }),
        admin.from("community_members").select("user_id", { count: "exact", head: true }).eq("room_id", liveChatRoom.id),
      ])
    : [{ count: 0 }, { count: 0 }];

  const messageIds = [...new Set((reports ?? []).map((r) => r.message_id))];
  const { data: messages } = messageIds.length
    ? await admin.from("community_messages").select("id, room_id, user_id, content, is_deleted").in("id", messageIds)
    : { data: [] as { id: string; room_id: string; user_id: string; content: string; is_deleted: boolean }[] };
  const messageById = new Map((messages ?? []).map((m) => [m.id, m]));

  const roomIds = [...new Set((messages ?? []).map((m) => m.room_id))];
  const { data: rooms } = roomIds.length
    ? await admin.from("community_rooms").select("id, name").in("id", roomIds)
    : { data: [] as { id: string; name: string }[] };
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r.name]));

  const userIds = [
    ...new Set([...(reports ?? []).map((r) => r.reported_by), ...(messages ?? []).map((m) => m.user_id)]),
  ];
  const { data: users } = userIds.length
    ? await admin.from("users").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const userById = new Map((users ?? []).map((u) => [u.id, u.full_name ?? u.email]));

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Moderacao da comunidade</h1>
      {!writable && <p className="mt-1 text-xs text-neutral-500">Modo somente leitura para o seu perfil.</p>}

      <section className="card mt-4 border-yellow-500/20 bg-yellow-500/[0.03]">
        <h2 className="text-sm font-semibold text-neutral-200">Diagnostico: Bate-papo ao vivo</h2>
        {liveChatRoom ? (
          <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
            <div className="flex justify-between gap-2">
              <dt>Sala encontrada</dt>
              <dd className="text-neutral-200">
                {liveChatRoom.name} ({liveChatRoom.slug})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Ativa</dt>
              <dd className={liveChatRoom.is_active ? "text-emerald-300" : "text-red-400"}>
                {liveChatRoom.is_active ? "sim" : "NAO — isso bloqueia a sala pra todo mundo"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Nivel minimo de acesso</dt>
              <dd className={liveChatRoom.min_access_level === "APP_USER" ? "text-emerald-300" : "text-red-400"}>
                {liveChatRoom.min_access_level}
                {liveChatRoom.min_access_level !== "APP_USER" && " — deveria ser APP_USER"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Membros com acesso liberado</dt>
              <dd className="text-neutral-200">
                {liveChatMembers ?? 0} de {totalUsers ?? 0} usuarios
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-red-400">
            Nenhuma sala com slug &quot;{LIVE_CHAT_SLUG}&quot; encontrada — a migration que cria essa sala nunca rodou
            neste banco.
          </p>
        )}

        {writable && liveChatRoom && (
          <form action={forceUnlockLiveChat} className="mt-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Forcar liberacao para todos agora
            </button>
          </form>
        )}
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Denuncias abertas</h2>
        <div className="flex flex-col gap-3">
          {reports?.map((report) => {
            const message = messageById.get(report.message_id);
            return (
              <div key={report.id} className="card">
                <p className="text-xs text-neutral-500">
                  Sala: {message ? roomById.get(message.room_id) : "—"} • Autor:{" "}
                  {message ? userById.get(message.user_id) : "—"} • Denunciado por: {userById.get(report.reported_by)}
                </p>
                <p className="mt-1 text-sm text-neutral-200">
                  {message?.is_deleted ? <span className="italic text-neutral-500">Mensagem ja excluida</span> : message?.content}
                </p>
                {report.reason && <p className="mt-1 text-xs text-neutral-500">Motivo: {report.reason}</p>}

                {writable && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={handleDismissReport.bind(null, report.id)}>
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                        Descartar
                      </button>
                    </form>
                    {message && !message.is_deleted && (
                      <form action={handleDeleteReportedMessage.bind(null, report.id, report.message_id)}>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs text-red-400">
                          Excluir mensagem
                        </button>
                      </form>
                    )}
                    {message && (
                      <form action={handleMuteAuthor.bind(null, report.id, message.room_id, message.user_id)}>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                          Silenciar autor nesta sala
                        </button>
                      </form>
                    )}
                    {message && (
                      <form action={handleRestrictUser.bind(null, report.id, message.user_id)}>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs text-red-400">
                          Bloquear conta
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {(!reports || reports.length === 0) && <p className="card text-sm text-neutral-500">Nenhuma denuncia pendente.</p>}
        </div>
      </section>

      <section className="mt-6 max-w-md">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Palavras bloqueadas</h2>
        {writable && (
          <form action={addBannedWord} className="flex gap-2">
            <input name="word" placeholder="nova palavra" className="input flex-1" />
            <button type="submit" className="btn-secondary px-4">
              Adicionar
            </button>
          </form>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {bannedWords?.map((w) =>
            writable ? (
              <form key={w.id} action={removeBannedWord.bind(null, w.id)}>
                <button type="submit" className="badge bg-neutral-800 text-neutral-300 hover:bg-red-500/20 hover:text-red-300">
                  {w.word} ✕
                </button>
              </form>
            ) : (
              <span key={w.id} className="badge bg-neutral-800 text-neutral-300">
                {w.word}
              </span>
            )
          )}
          {(!bannedWords || bannedWords.length === 0) && <p className="text-sm text-neutral-500">Nenhuma palavra bloqueada.</p>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Log de moderacao</h2>
        <div className="flex flex-col gap-2">
          {recentActions?.map((a) => (
            <div key={a.id} className="card flex items-center justify-between text-sm">
              <span className="text-neutral-300">
                {a.action_type} • {a.target_user_id ? userById.get(a.target_user_id) ?? a.target_user_id : "—"}
                {a.reason ? ` — ${a.reason}` : ""}
              </span>
              <span className="text-xs text-neutral-500">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
          {(!recentActions || recentActions.length === 0) && (
            <p className="card text-sm text-neutral-500">Nenhuma acao registrada.</p>
          )}
        </div>
      </section>
    </div>
  );
}
