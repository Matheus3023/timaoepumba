import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logTimelineEvent } from "@/lib/crm/timeline";
import type { AccessLevel } from "@/types/database";

/**
 * Access level ranking (PRD sec. 10). Higher rank = more features. Used to
 * decide "does this access level satisfy that minimum requirement" without
 * hardcoding feature-by-feature logic — the actual feature list per level
 * lives in the `entitlements` table and is editable by admins (sec. 7).
 */
const LEVEL_RANK: Record<AccessLevel, number> = {
  VISITOR: 0,
  APP_USER: 1,
  REGISTERED_USER: 2,
  FTD_USER: 3,
  ADMIN: 4,
  RESTRICTED_USER: -1, // always below everything, regardless of prior progress
};

export function accessLevelSatisfies(current: AccessLevel, required: AccessLevel): boolean {
  if (current === "RESTRICTED_USER") return false;
  return LEVEL_RANK[current] >= LEVEL_RANK[required];
}

/**
 * Checks whether a given feature_key is released for an access level, per
 * the admin-configurable `entitlements` table (falls back to `false` if no
 * row exists — features must be explicitly enabled).
 */
export async function isFeatureEnabled(accessLevel: AccessLevel, featureKey: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("entitlements")
    .select("enabled")
    .eq("access_level", accessLevel)
    .eq("feature_key", featureKey)
    .maybeSingle();
  return data?.enabled ?? false;
}

/**
 * Promotes a user to a new access level (never downgrades, except to
 * RESTRICTED_USER which moderation applies explicitly) and keeps their
 * community room memberships in sync with the rooms unlocked at that
 * level. This is the single place "liberar recursos" happens so the
 * release rules stay data-driven instead of scattered across webhook code.
 */
export async function promoteAccessLevel(userId: string, newLevel: AccessLevel) {
  const admin = createAdminSupabaseClient();

  const { data: user } = await admin.from("users").select("access_level").eq("id", userId).single();
  if (!user) return;

  const isUpgrade =
    newLevel === "RESTRICTED_USER" || LEVEL_RANK[newLevel] > LEVEL_RANK[user.access_level];

  if (!isUpgrade) return;

  await admin.from("users").update({ access_level: newLevel }).eq("id", userId);
  await syncCommunityMembership(userId, newLevel);

  if (newLevel === "REGISTERED_USER") {
    await logTimelineEvent({
      userId,
      eventType: "community_access_granted",
      description: "Comunidade liberada",
    });
  }
  if (newLevel === "FTD_USER") {
    await logTimelineEvent({
      userId,
      eventType: "access_level_upgraded",
      description: "Novo nivel de acesso liberado",
    });
  }
}

/**
 * Ensures the user is a member of every active community room whose
 * min_access_level they now satisfy (PRD sec. 7.3/7.4 — community/room
 * access unlocks progressively as the user advances through the funnel).
 */
export async function syncCommunityMembership(userId: string, accessLevel: AccessLevel) {
  const admin = createAdminSupabaseClient();

  const { data: rooms } = await admin.from("community_rooms").select("id, min_access_level").eq("is_active", true);
  if (!rooms) return;

  const eligibleRoomIds = rooms
    .filter((room) => accessLevelSatisfies(accessLevel, room.min_access_level))
    .map((room) => room.id);

  if (eligibleRoomIds.length === 0) return;

  await admin.from("community_members").upsert(
    eligibleRoomIds.map((roomId) => ({ room_id: roomId, user_id: userId, role: "usuario" })),
    { onConflict: "room_id,user_id", ignoreDuplicates: true }
  );
}

/** Sets a user to RESTRICTED_USER: blocks promotional pushes and community participation (sec. 10.5). */
export async function restrictUser(userId: string, reason: string, performedBy?: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("users").update({ access_level: "RESTRICTED_USER" }).eq("id", userId);
  await Promise.all([
    admin.from("moderation_actions").insert({
      target_user_id: userId,
      action_type: "suspend",
      reason,
      performed_by: performedBy ?? null,
    }),
    logTimelineEvent({ userId, eventType: "user_restricted", description: `Usuario restrito: ${reason}` }),
  ]);
}
