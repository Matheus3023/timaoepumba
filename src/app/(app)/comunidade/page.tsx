import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { trackServerEvent } from "@/lib/tracking/events";
import { CommunityRoomChat } from "@/components/community/CommunityRoomChat";
import { ChatIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";

const LIVE_CHAT_SLUG = "resenha-geral";

export default async function CommunityRoomsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Membership self-heal now runs once per app view in (app)/layout.tsx,
  // covering every page, not just this one.
  const [{ data: room }, { data: memberships }] = await Promise.all([
    supabase.from("community_rooms").select("*").eq("is_active", true).eq("slug", LIVE_CHAT_SLUG).maybeSingle(),
    supabase.from("community_members").select("room_id").eq("user_id", user!.id),
  ]);

  const unlocked = room ? (memberships ?? []).some((m) => m.room_id === room.id) : false;

  if (room && unlocked) {
    return <CommunityChatEmbed roomId={room.id} roomName={room.name} userId={user!.id} />;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <PageHeader title="Bate-papo" description="Converse, resenhe e acompanhe os jogos com quem tem o app instalado." />

      <div className="card-glow mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
          <ChatIcon width={22} height={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Bate-papo ao vivo</p>
          <p className="text-sm text-neutral-400">Libera assim que voce cria sua conta</p>
        </div>
        <span className="badge shrink-0 bg-neutral-700/50 text-neutral-300">🔒</span>
      </div>
    </div>
  );
}

async function CommunityChatEmbed({ roomId, roomName, userId }: { roomId: string; roomName: string; userId: string }) {
  const admin = createAdminSupabaseClient();
  const { data: initialMessages } = await admin
    .from("community_messages")
    .select("id, user_id, content, created_at, is_pinned")
    .eq("room_id", roomId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const authorIds = [...new Set((initialMessages ?? []).map((m) => m.user_id))];
  const [{ data: authors }, { data: authorMemberships }, { data: currentUser }] = await Promise.all([
    authorIds.length
      ? admin.from("users").select("id, full_name").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    authorIds.length
      ? admin.from("community_members").select("user_id, role").eq("room_id", roomId).in("user_id", authorIds)
      : Promise.resolve({ data: [] as { user_id: string; role: string }[] }),
    admin.from("users").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  const authorNameById = new Map((authors ?? []).map((a) => [a.id, a.full_name ?? "Torcedor"]));
  const authorRoleById = new Map((authorMemberships ?? []).map((m) => [m.user_id, m.role]));

  await trackServerEvent({ eventName: "CommunityRoomEntered", userId, properties: { room_id: roomId } });

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <CommunityRoomChat
        roomId={roomId}
        roomName={roomName}
        currentUserId={userId}
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
