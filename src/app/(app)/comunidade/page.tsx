import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncCommunityMembership } from "@/lib/entitlements/rules";
import { ChatIcon } from "@/components/icons";

const LIVE_CHAT_SLUG = "resenha-geral";

export default async function CommunityRoomsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appUser } = await supabase.from("users").select("access_level").eq("id", user!.id).single();

  // Self-heals membership on every visit instead of relying only on the
  // signup/webhook hooks having fired correctly — cheap (upsert, no-op if
  // already a member) and closes the gap for any account created between
  // a schema change and its rollout, or missed by a one-time backfill.
  if (appUser) {
    await syncCommunityMembership(user!.id, appUser.access_level);
  }

  const [{ data: rooms }, { data: memberships }] = await Promise.all([
    supabase.from("community_rooms").select("*").eq("is_active", true).order("position"),
    supabase.from("community_members").select("room_id").eq("user_id", user!.id),
  ]);

  const memberRoomIds = new Set((memberships ?? []).map((m) => m.room_id));
  const liveChat = rooms?.find((r) => r.slug === LIVE_CHAT_SLUG);
  const topicRooms = rooms?.filter((r) => r.slug !== LIVE_CHAT_SLUG) ?? [];
  const liveChatUnlocked = liveChat ? memberRoomIds.has(liveChat.id) : false;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Bate-papo</h1>
      <p className="text-sm text-neutral-400">Converse, resenhe e acompanhe os jogos com quem tem o app instalado.</p>

      {liveChat && (
        <Link
          href={liveChatUnlocked ? `/comunidade/${liveChat.slug}` : "/home"}
          className="card-glow mt-4 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
            <ChatIcon width={22} height={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-semibold text-white">
              {liveChatUnlocked && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-live rounded-full bg-red-500" />}
              Bate-papo ao vivo
            </p>
            <p className="text-sm text-neutral-400">
              {liveChatUnlocked ? "Entre e converse com a torcida agora" : "Libera assim que voce cria sua conta"}
            </p>
          </div>
          {liveChatUnlocked ? (
            <span className="text-neutral-500">→</span>
          ) : (
            <span className="badge shrink-0 bg-neutral-700/50 text-neutral-300">🔒</span>
          )}
        </Link>
      )}

      {topicRooms.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-neutral-200">Salas por campeonato</h2>
          <p className="mb-2 text-xs text-neutral-500">Liberam depois do cadastro confirmado na casa parceira.</p>
          <div className="flex flex-col gap-2">
            {topicRooms.map((room) => {
              const unlocked = memberRoomIds.has(room.id);
              return (
                <Link
                  key={room.id}
                  href={unlocked ? `/comunidade/${room.slug}` : "/home"}
                  className="card flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{room.name}</p>
                    {room.description && <p className="text-sm text-neutral-400">{room.description}</p>}
                  </div>
                  {!unlocked && <span className="badge bg-neutral-700/50 text-neutral-300">🔒</span>}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
