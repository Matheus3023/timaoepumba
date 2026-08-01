import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/fcm";

const bodySchema = z.object({
  roomId: z.string().uuid(),
  messageId: z.string().uuid(),
});

/** A user is treated as offline if there's no presence row, it's not "online", or it's gone stale — a closed tab doesn't reliably clean up its own row. */
const ONLINE_STALE_MS = 90_000;

/**
 * Push-notifies community members who are offline about a new chat
 * message from the admin — regular members' messages never trigger a
 * push, only the admin's. Called fire-and-forget from the client right
 * after a successful send (community_messages inserts go straight
 * through the browser client, RLS-gated — there's no server route in
 * that path to hook this into otherwise).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { roomId, messageId } = parsed.data;

  const admin = createAdminSupabaseClient();

  // Re-fetch the message server-side instead of trusting client-supplied
  // content — also confirms the caller is really the message's author
  // before fanning out notifications on their behalf.
  const { data: message } = await admin
    .from("community_messages")
    .select("room_id, user_id, content")
    .eq("id", messageId)
    .maybeSingle();

  if (!message || message.room_id !== roomId || message.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: senderMembership } = await admin
    .from("community_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Only the admin's own messages page offline members — a message from a
  // regular torcedor doesn't push anyone, or every back-and-forth in the
  // room would spam offline members' phones.
  if (senderMembership?.role !== "administrador") {
    return NextResponse.json({ sent: 0, skipped: "not_admin" });
  }

  const [{ data: room }, { data: sender }, { data: members }] = await Promise.all([
    admin.from("community_rooms").select("name").eq("id", roomId).maybeSingle(),
    admin.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    admin.from("community_members").select("user_id").eq("room_id", roomId).neq("user_id", user.id),
  ]);

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 });
  }

  const memberIds = members.map((m) => m.user_id);
  const { data: presenceRows } = await admin
    .from("user_presence")
    .select("user_id, status, last_activity_at")
    .in("user_id", memberIds);

  const onlineIds = new Set(
    (presenceRows ?? [])
      .filter((p) => p.status === "online" && Date.now() - new Date(p.last_activity_at).getTime() < ONLINE_STALE_MS)
      .map((p) => p.user_id)
  );
  const offlineIds = memberIds.filter((id) => !onlineIds.has(id));

  const senderName = sender?.full_name ?? "Alguem";
  const preview = message.content.length > 100 ? `${message.content.slice(0, 100)}...` : message.content;

  const results = await Promise.all(
    offlineIds.map((memberId) =>
      sendPushToUser(memberId, {
        title: room?.name ?? "Nova mensagem no bate-papo",
        body: `${senderName}: ${preview}`,
        link: "/comunidade",
      })
    )
  );

  const sent = results.reduce((total, r) => total + r.sent, 0);
  return NextResponse.json({ sent, skipped: onlineIds.size });
}
