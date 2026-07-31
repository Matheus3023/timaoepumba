import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Appends a human-readable entry to the user's CRM timeline (PRD sec. 15.3
 * / onboarding sec. 7). This is what powers the "20:31 — Acessou pelo
 * anuncio..." style feed in the admin panel.
 */
export async function logTimelineEvent(params: {
  userId: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("crm_timeline_events").insert({
    user_id: params.userId,
    event_type: params.eventType,
    description: params.description,
    metadata: params.metadata ?? {},
  });
  if (error) {
    console.error("[crm] failed to log timeline event", error);
  }
}
