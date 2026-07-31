import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes the four-dimension lead score (PRD sec. 13) for one user from
 * existing signals — no separate event-sourced scoring pipeline, this
 * reads the same tables the rest of the CRM already writes to (registrations,
 * ftds, community_messages, push_deliveries, etc.) so there's a single
 * source of truth. Meant to be called on demand (profile view, bulk
 * "recalcular" action) rather than streamed per-event.
 *
 * Not implemented: poll_answered (no community_polls table yet). Engagement
 * decay (sec. 13.6) is applied here based on last_seen_at recency —
 * intent/relationship are never decayed, matching "eventos de cadastro e
 * FTD nao deverao ser removidos".
 */
export async function computeUserScore(userId: string): Promise<{
  intent: number;
  engagement: number;
  relationship: number;
  total: number;
  riskBlocked: boolean;
  riskReason: string | null;
}> {
  const admin = createAdminSupabaseClient();

  const [
    { data: user },
    { data: profile },
    { data: clicks },
    { data: registration },
    { data: ftd },
    { data: analysisViews },
    { data: communityMembership },
    { data: messages },
    { data: pushDeliveries },
    { data: subscriptions },
    { data: optOut },
    { data: trackingEvents },
  ] = await Promise.all([
    admin.from("users").select("access_level, status").eq("id", userId).maybeSingle(),
    admin
      .from("user_profiles")
      .select("onboarding_completed, favorite_team_id, favorite_leagues, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle(),
    admin.from("affiliate_clicks").select("id").eq("user_id", userId),
    admin.from("registrations").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("ftds").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("analysis_views").select("id").eq("user_id", userId),
    admin.from("community_members").select("room_id").eq("user_id", userId).limit(1).maybeSingle(),
    admin.from("community_messages").select("id").eq("user_id", userId),
    admin.from("push_deliveries").select("status").eq("user_id", userId),
    admin.from("push_subscriptions").select("status").eq("user_id", userId),
    admin.from("marketing_optouts").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("tracking_events").select("created_at").eq("user_id", userId).eq("event_name", "PageView"),
  ]);

  // Intent (proximidade de cadastro/FTD) — sec. 13.1
  let intent = 10; // account_created — every row in `users` reached this
  if (profile?.onboarding_completed) intent += 5;
  const clickCount = clicks?.length ?? 0;
  if (clickCount >= 1) intent += 20 + Math.min(clickCount - 1, 3) * 5;
  if (registration) intent += 35;
  if (ftd) intent += 50;
  intent = clamp(intent);

  // Engagement (uso do app) — sec. 13.2
  const pageViewCount = trackingEvents?.length ?? 0;
  const distinctDays = new Set((trackingEvents ?? []).map((e) => e.created_at.slice(0, 10))).size;
  let engagement = Math.min(pageViewCount, 10);
  if (distinctDays >= 3) engagement += 5;
  engagement += Math.min(analysisViews?.length ?? 0, 5) * 3;
  const favoriteCount = (profile?.favorite_team_id ? 1 : 0) + Math.min((profile?.favorite_leagues ?? []).length, 2);
  engagement += favoriteCount * 2;
  if (communityMembership) engagement += 5;
  engagement += Math.min(messages?.length ?? 0, 5) * 2;

  // Decay (sec. 13.6) — engagement only, never intent/relationship
  if (profile?.last_seen_at) {
    const daysInactive = (Date.now() - new Date(profile.last_seen_at).getTime()) / 86400000;
    if (daysInactive >= 30) engagement *= 0.5;
    else if (daysInactive >= 15) engagement *= 0.75;
    else if (daysInactive >= 7) engagement *= 0.9;
  }
  engagement = clamp(Math.round(engagement));

  // Relationship (resposta as comunicacoes) — sec. 13.3
  const sentCount = (pushDeliveries ?? []).filter((d) => ["sent", "delivered", "opened", "clicked"].includes(d.status)).length;
  const openedCount = (pushDeliveries ?? []).filter((d) => ["opened", "clicked"].includes(d.status)).length;
  const clickedCount = (pushDeliveries ?? []).filter((d) => d.status === "clicked").length;
  let relationship = Math.min(openedCount, 5) * 2 + Math.min(clickedCount, 5) * 4;
  if (sentCount - openedCount >= 5) relationship -= 5;
  if (subscriptions?.some((s) => s.status === "failed")) relationship -= 10;
  relationship = clamp(relationship);

  // Risk/compliance (sec. 13.4) — gates communications, never used to pressure the user
  const restricted = user?.access_level === "RESTRICTED_USER";
  const suspended = user?.status !== "active";
  const riskBlocked = restricted || suspended || !!optOut;
  const riskReason = restricted ? "restricted" : suspended ? "suspended" : optOut ? "opted_out" : null;

  const total = clamp(Math.round(intent * 0.5 + engagement * 0.3 + relationship * 0.2));

  return { intent, engagement, relationship, total, riskBlocked, riskReason };
}

export async function computeAndSaveUserScore(userId: string) {
  const admin = createAdminSupabaseClient();
  const score = await computeUserScore(userId);
  await admin.from("user_scores").upsert({
    user_id: userId,
    intent_score: score.intent,
    engagement_score: score.engagement,
    relationship_score: score.relationship,
    total_score: score.total,
    risk_blocked: score.riskBlocked,
    risk_reason: score.riskReason,
    calculated_at: new Date().toISOString(),
  });
  return score;
}

export async function recalculateAllScores(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data: users } = await admin.from("users").select("id");
  const ids = (users ?? []).map((u) => u.id);
  for (const id of ids) {
    await computeAndSaveUserScore(id);
  }
  return ids.length;
}
