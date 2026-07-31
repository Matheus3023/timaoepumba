import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SegmentCondition } from "@/lib/segments/types";
import type { AccessLevel } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

const ACCESS_LEVEL_RANK: Record<string, number> = {
  VISITOR: 0,
  APP_USER: 1,
  REGISTERED_USER: 2,
  FTD_USER: 3,
  RESTRICTED_USER: -1,
  ADMIN: 4,
};

async function allActiveUserIds(admin: AdminClient): Promise<Set<string>> {
  const { data } = await admin.from("users").select("id").eq("status", "active");
  return new Set((data ?? []).map((u) => u.id));
}

function countBy(ids: (string | null)[], min: number): Set<string> {
  const counts = new Map<string, number>();
  for (const id of ids) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, c]) => c >= min).map(([id]) => id));
}

/** Evaluates a single condition into the set of matching user ids. */
async function evaluateCondition(admin: AdminClient, condition: SegmentCondition): Promise<Set<string>> {
  switch (condition.type) {
    case "access_level_equals": {
      const { data } = await admin.from("users").select("id").eq("access_level", String(condition.value) as AccessLevel);
      return new Set((data ?? []).map((u) => u.id));
    }
    case "access_level_at_least": {
      const min = ACCESS_LEVEL_RANK[String(condition.value)] ?? 0;
      const { data } = await admin.from("users").select("id, access_level");
      return new Set((data ?? []).filter((u) => (ACCESS_LEVEL_RANK[u.access_level] ?? -1) >= min).map((u) => u.id));
    }
    case "pwa_installed": {
      const { data } = await admin.from("user_profiles").select("user_id").eq("pwa_install_status", "installed");
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "pwa_not_installed": {
      const { data } = await admin.from("user_profiles").select("user_id").neq("pwa_install_status", "installed");
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "push_authorized": {
      const { data } = await admin.from("user_profiles").select("user_id").eq("notification_permission", "granted");
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "push_not_authorized": {
      const { data } = await admin.from("user_profiles").select("user_id").neq("notification_permission", "granted");
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "installed_no_push": {
      const { data } = await admin
        .from("user_profiles")
        .select("user_id")
        .eq("pwa_install_status", "installed")
        .neq("notification_permission", "granted");
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "onboarding_incomplete": {
      const { data } = await admin.from("user_profiles").select("user_id").eq("onboarding_completed", false);
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "never_opened_app": {
      const { data } = await admin.from("user_profiles").select("user_id").is("last_seen_at", null);
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "active_within_days": {
      const cutoff = new Date(Date.now() - Number(condition.value ?? 1) * 86400000).toISOString();
      const { data } = await admin.from("user_profiles").select("user_id").gte("last_seen_at", cutoff);
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "inactive_days_at_least": {
      const cutoff = new Date(Date.now() - Number(condition.value ?? 3) * 86400000).toISOString();
      const { data } = await admin.from("user_profiles").select("user_id").lt("last_seen_at", cutoff);
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "community_member": {
      const { data } = await admin.from("community_members").select("user_id");
      return new Set((data ?? []).map((m) => m.user_id));
    }
    case "community_messages_at_least": {
      const { data } = await admin.from("community_messages").select("user_id");
      return countBy((data ?? []).map((m) => m.user_id), Number(condition.value ?? 1));
    }
    case "marketing_opted_out": {
      const { data } = await admin.from("marketing_optouts").select("user_id");
      return new Set((data ?? []).map((o) => o.user_id));
    }
    case "restricted": {
      const { data } = await admin.from("users").select("id").eq("access_level", "RESTRICTED_USER");
      return new Set((data ?? []).map((u) => u.id));
    }
    case "affiliate_clicked_no_registration": {
      const [{ data: clicks }, { data: regs }] = await Promise.all([
        admin.from("affiliate_clicks").select("user_id"),
        admin.from("registrations").select("user_id"),
      ]);
      const registered = new Set((regs ?? []).map((r) => r.user_id));
      const clickerIds = (clicks ?? []).map((c) => c.user_id).filter((id): id is string => !!id);
      return new Set(clickerIds.filter((id) => !registered.has(id)));
    }
    case "registration_no_ftd": {
      const [{ data: regs }, { data: ftds }] = await Promise.all([
        admin.from("registrations").select("user_id"),
        admin.from("ftds").select("user_id"),
      ]);
      const withFtd = new Set((ftds ?? []).map((f) => f.user_id));
      return new Set((regs ?? []).map((r) => r.user_id).filter((id) => !withFtd.has(id)));
    }
    case "ftd_confirmed": {
      const { data } = await admin.from("ftds").select("user_id");
      return new Set((data ?? []).map((f) => f.user_id));
    }
    case "postback_failed": {
      const { data: rejected } = await admin.from("affiliate_events").select("lead_id").eq("status", "rejected");
      const leadIds = [...new Set((rejected ?? []).map((r) => r.lead_id).filter((id): id is string => !!id))];
      if (!leadIds.length) return new Set();
      const { data: users } = await admin.from("users").select("id").in("lead_id", leadIds);
      return new Set((users ?? []).map((u) => u.id));
    }
    case "favorited_team": {
      const { data } = await admin.from("user_profiles").select("user_id").not("favorite_team_id", "is", null);
      return new Set((data ?? []).map((p) => p.user_id));
    }
    case "match_views_at_least": {
      const { data } = await admin.from("tracking_events").select("user_id").eq("event_name", "MatchViewed");
      return countBy((data ?? []).map((e) => e.user_id), Number(condition.value ?? 3));
    }
    case "no_push_received_last_hours": {
      const cutoff = new Date(Date.now() - Number(condition.value ?? 24) * 3600000).toISOString();
      const [all, { data: recentlySent }] = await Promise.all([
        allActiveUserIds(admin),
        admin.from("push_deliveries").select("user_id").gte("sent_at", cutoff),
      ]);
      const sentRecently = new Set((recentlySent ?? []).map((d) => d.user_id).filter((id): id is string => !!id));
      return new Set([...all].filter((id) => !sentRecently.has(id)));
    }
    default:
      return new Set();
  }
}

/**
 * Resolves a segment definition (array of conditions, ANDed) into a flat
 * list of matching user ids. An empty definition means "all active users"
 * — the built-in fallback segment used before this feature existed.
 */
export async function resolveSegmentUserIds(conditions: SegmentCondition[]): Promise<string[]> {
  const admin = createAdminSupabaseClient();

  if (conditions.length === 0) {
    return [...(await allActiveUserIds(admin))];
  }

  const sets = await Promise.all(conditions.map((condition) => evaluateCondition(admin, condition)));
  const [first, ...rest] = sets;
  const intersected = rest.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id))), first);
  return [...intersected];
}
