import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { deleteMessage, muteUserInRoom, reviewReport } from "@/lib/moderation/actions";
import { restrictUser } from "@/lib/entitlements/rules";

async function getModeratorId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user!.id;
}

async function handleDismissReport(reportId: string) {
  "use server";
  await reviewReport(reportId, "dismissed");
  revalidatePath("/admin/comunidade");
}

async function handleDeleteReportedMessage(reportId: string, messageId: string) {
  "use server";
  const moderatorId = await getModeratorId();
  await deleteMessage(messageId, moderatorId, "Denuncia da comunidade");
  await reviewReport(reportId, "reviewed");
  revalidatePath("/admin/comunidade");
}

async function handleMuteAuthor(reportId: string, roomId: string, userId: string) {
  "use server";
  const moderatorId = await getModeratorId();
  await muteUserInRoom(roomId, userId, moderatorId, "Denuncia da comunidade");
  await reviewReport(reportId, "reviewed");
  revalidatePath("/admin/comunidade");
}

async function handleRestrictUser(reportId: string, userId: string) {
  "use server";
  const moderatorId = await getModeratorId();
  await restrictUser(userId, "Denuncia da comunidade — conta bloqueada", moderatorId);
  await reviewReport(reportId, "reviewed");
  revalidatePath("/admin/comunidade");
}

async function addBannedWord(formData: FormData) {
  "use server";
  const word = String(formData.get("word") ?? "").trim().toLowerCase();
  if (!word) return;
  const admin = createAdminSupabaseClient();
  await admin.from("banned_words").insert({ word });
  revalidatePath("/admin/comunidade");
}

async function removeBannedWord(wordId: string) {
  "use server";
  const admin = createAdminSupabaseClient();
  await admin.from("banned_words").delete().eq("id", wordId);
  revalidatePath("/admin/comunidade");
}

export default async function AdminCommunityModerationPage() {
  const admin = createAdminSupabaseClient();

  const [{ data: reports }, { data: bannedWords }, { data: recentActions }] = await Promise.all([
    admin.from("message_reports").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    admin.from("banned_words").select("*").order("word"),
    admin.from("moderation_actions").select("*").order("created_at", { ascending: false }).limit(30),
  ]);

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
              </div>
            );
          })}
          {(!reports || reports.length === 0) && <p className="card text-sm text-neutral-500">Nenhuma denuncia pendente.</p>}
        </div>
      </section>

      <section className="mt-6 max-w-md">
        <h2 className="mb-2 text-sm font-semibold text-neutral-200">Palavras bloqueadas</h2>
        <form action={addBannedWord} className="flex gap-2">
          <input name="word" placeholder="nova palavra" className="input flex-1" />
          <button type="submit" className="btn-secondary px-4">
            Adicionar
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">
          {bannedWords?.map((w) => (
            <form key={w.id} action={removeBannedWord.bind(null, w.id)}>
              <button type="submit" className="badge bg-neutral-800 text-neutral-300 hover:bg-red-500/20 hover:text-red-300">
                {w.word} ✕
              </button>
            </form>
          ))}
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
