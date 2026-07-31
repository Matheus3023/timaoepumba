import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CommunityRoomsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rooms }, { data: memberships }] = await Promise.all([
    supabase.from("community_rooms").select("*").eq("is_active", true).order("position"),
    supabase.from("community_members").select("room_id").eq("user_id", user!.id),
  ]);

  const memberRoomIds = new Set((memberships ?? []).map((m) => m.room_id));

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Comunidade</h1>
      <p className="text-sm text-neutral-400">Salas por campeonato. Comente, reaja e vote em enquetes.</p>

      <div className="mt-4 flex flex-col gap-2">
        {rooms?.map((room) => {
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
    </div>
  );
}
