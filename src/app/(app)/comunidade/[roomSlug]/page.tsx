import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { trackServerEvent } from "@/lib/tracking/events";
import { CommunityRoomChat } from "@/components/community/CommunityRoomChat";

export default async function CommunityRoomPage({ params }: { params: Promise<{ roomSlug: string }> }) {
  const { roomSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room } = await supabase.from("community_rooms").select("*").eq("slug", roomSlug).maybeSingle();
  if (!room) notFound();

  const { data: membership } = await supabase
    .from("community_members")
    .select("room_id")
    .eq("room_id", room.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!membership) redirect("/comunidade");

  const admin = createAdminSupabaseClient();
  const { data: initialMessages } = await admin
    .from("community_messages")
    .select("id, user_id, content, created_at, is_pinned")
    .eq("room_id", room.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const authorIds = [...new Set((initialMessages ?? []).map((m) => m.user_id))];
  const [{ data: authors }, { data: authorMemberships }, { data: currentUser }] = await Promise.all([
    authorIds.length
      ? admin.from("users").select("id, full_name").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    authorIds.length
      ? admin.from("community_members").select("user_id, role").eq("room_id", room.id).in("user_id", authorIds)
      : Promise.resolve({ data: [] as { user_id: string; role: string }[] }),
    admin.from("users").select("full_name").eq("id", user!.id).maybeSingle(),
  ]);
  const authorNameById = new Map((authors ?? []).map((a) => [a.id, a.full_name ?? "Torcedor"]));
  const authorRoleById = new Map((authorMemberships ?? []).map((m) => [m.user_id, m.role]));

  await trackServerEvent({ eventName: "CommunityRoomEntered", userId: user!.id, properties: { room_id: room.id } });

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <CommunityRoomChat
        roomId={room.id}
        roomName={room.name}
        currentUserId={user!.id}
        currentUserName={currentUser?.full_name ?? "Torcedor"}
        initialMessages={(initialMessages ?? []).reverse().map((m) => ({
          id: m.id,
          user_id: m.user_id,
          content: m.content,
          created_at: m.created_at,
          is_pinned: m.is_pinned,
          author_name: authorNameById.get(m.user_id) ?? "Torcedor",
          author_role: authorRoleById.get(m.user_id) ?? "usuario",
        }))}
      />
    </div>
  );
}
