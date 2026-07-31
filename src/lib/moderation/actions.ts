import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";

/** Soft-deletes a message and logs the action (PRD sec. 14.4 "excluir mensagem"). */
export async function deleteMessage(messageId: string, moderatorId: string, reason?: string) {
  const admin = createAdminSupabaseClient();

  const { data: message } = await admin
    .from("community_messages")
    .select("user_id")
    .eq("id", messageId)
    .maybeSingle();

  await admin.from("community_messages").update({ is_deleted: true }).eq("id", messageId);

  await admin.from("moderation_actions").insert({
    target_user_id: message?.user_id ?? null,
    message_id: messageId,
    action_type: "delete_message",
    reason: reason ?? null,
    performed_by: moderatorId,
  });
}

/** Silences a user within a single room (PRD sec. 14.4 "silenciar usuario"). Scoped, not account-wide. */
export async function muteUserInRoom(roomId: string, userId: string, moderatorId: string, reason?: string) {
  const admin = createAdminSupabaseClient();

  await admin.from("community_members").update({ role: "usuario_restrito" }).eq("room_id", roomId).eq("user_id", userId);

  await Promise.all([
    admin.from("moderation_actions").insert({
      target_user_id: userId,
      action_type: "mute",
      reason: reason ?? null,
      performed_by: moderatorId,
    }),
    logTimelineEvent({ userId, eventType: "muted_in_room", description: "Silenciado em uma sala da comunidade" }),
  ]);
}

export async function unmuteUserInRoom(roomId: string, userId: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("community_members").update({ role: "usuario" }).eq("room_id", roomId).eq("user_id", userId);
}

export async function reviewReport(reportId: string, status: "reviewed" | "dismissed") {
  const admin = createAdminSupabaseClient();
  await admin.from("message_reports").update({ status }).eq("id", reportId);
}
