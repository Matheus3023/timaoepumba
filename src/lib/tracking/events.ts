import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Canonical event names from PRD sec. 6.3. Kept as a union so callers get
 * autocomplete/typo protection, while still allowing ad-hoc names via the
 * string fallback (some destinations may need custom events later).
 */
export type TrackingEventName =
  | "PageView"
  | "ViewContent"
  | "AppRegistrationStarted"
  | "AppRegistrationCompleted"
  | "SportsbookLinkClicked"
  | "SportsbookRegistrationConfirmed"
  | "CommunityAccessGranted"
  | "FTDConfirmed"
  | "AnalysisViewed"
  | "MatchViewed"
  | "CommunityRoomEntered"
  | "PushReceived"
  | "PushOpened"
  | "UserReactivated"
  | "PWAInstallPromptViewed"
  | "PWAInstallButtonClicked"
  | "PWAInstallAccepted"
  | "PWAInstallDismissed"
  | "PWAInstallUnavailable"
  | "PWAOpenedStandalone"
  | "PushOnboardingViewed"
  | "PushPermissionButtonClicked"
  | "PushPermissionGranted"
  | "PushPermissionDenied"
  | "PushPermissionDismissed"
  | "PushUnsupported"
  | "PushSubscriptionCreated"
  | "PushSubscriptionFailed"
  | (string & {});

/**
 * Records a tracking event server-side. PRD sec. 6.3 asks that events be
 * sent from the backend whenever possible, since server events are not
 * subject to ad-blockers or browser restrictions the way client-only
 * pixels are.
 */
export async function trackServerEvent(params: {
  eventName: TrackingEventName;
  leadId?: string | null;
  userId?: string | null;
  properties?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("tracking_events")
    .insert({
      event_name: params.eventName,
      lead_id: params.leadId ?? null,
      user_id: params.userId ?? null,
      properties: params.properties ?? {},
      source: "server",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[tracking] failed to record ${params.eventName}`, error);
    return null;
  }

  return data.id;
}
