import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AttributionSnapshot } from "@/lib/tracking/attribution";

/**
 * Persists an attribution snapshot (from the first_touch/last_touch
 * cookies) to attribution_data. First-touch is inserted once per lead_id
 * (unique index uq_attribution_first_touch enforces this); last-touch is
 * appended on every visit that carries new campaign params so the most
 * recent row always reflects the latest touch (PRD sec. 6.2).
 */
export async function persistAttributionTouch(params: {
  leadId: string;
  userId?: string | null;
  touchType: "first" | "last";
  snapshot: AttributionSnapshot;
}) {
  const supabase = createAdminSupabaseClient();
  const { leadId, userId, touchType, snapshot } = params;

  if (touchType === "first") {
    const { data: existing } = await supabase
      .from("attribution_data")
      .select("id")
      .eq("lead_id", leadId)
      .eq("touch_type", "first")
      .maybeSingle();

    if (existing) return;
  }

  await supabase.from("attribution_data").insert({
    lead_id: leadId,
    user_id: userId ?? null,
    touch_type: touchType,
    utm_source: snapshot.utm_source ?? null,
    utm_medium: snapshot.utm_medium ?? null,
    utm_campaign: snapshot.utm_campaign ?? null,
    utm_content: snapshot.utm_content ?? null,
    utm_term: snapshot.utm_term ?? null,
    campaign_id: snapshot.campaign_id ?? null,
    adset_id: snapshot.adset_id ?? null,
    ad_id: snapshot.ad_id ?? null,
    fbclid: snapshot.fbclid ?? null,
    fbc: snapshot.fbc ?? null,
    fbp: snapshot.fbp ?? null,
    gclid: snapshot.gclid ?? null,
    ttclid: snapshot.ttclid ?? null,
  });
}

export async function recordAcquisitionSession(params: {
  leadId: string;
  userId?: string | null;
  visitorId: string;
  entryPage?: string | null;
  previousPage?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  userAgent?: string | null;
}) {
  const supabase = createAdminSupabaseClient();

  await supabase.from("acquisition_sessions").insert({
    lead_id: params.leadId,
    user_id: params.userId ?? null,
    visitor_id: params.visitorId,
    entry_page: params.entryPage ?? null,
    previous_page: params.previousPage ?? null,
    device: params.device ?? null,
    browser: params.browser ?? null,
    os: params.os ?? null,
    user_agent: params.userAgent ?? null,
  });
}

/**
 * Links previously-anonymous attribution/session rows for a lead_id to the
 * user_id created at signup, so the CRM can trace the full journey from
 * the very first ad click.
 */
export async function attachUserIdToLead(leadId: string, userId: string) {
  const supabase = createAdminSupabaseClient();
  await Promise.all([
    supabase.from("attribution_data").update({ user_id: userId }).eq("lead_id", leadId),
    supabase.from("acquisition_sessions").update({ user_id: userId }).eq("lead_id", leadId),
    supabase.from("affiliate_clicks").update({ user_id: userId }).eq("lead_id", leadId),
    supabase.from("tracking_events").update({ user_id: userId }).eq("lead_id", leadId),
  ]);
}
