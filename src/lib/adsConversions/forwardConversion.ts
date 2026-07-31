import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ConversionEventName = "SportsbookRegistrationConfirmed" | "FTDConfirmed";

interface ForwardConversionParams {
  trackingEventId: string;
  eventName: ConversionEventName;
  attribution: {
    fbc?: string | null;
    fbp?: string | null;
    gclid?: string | null;
    ttclid?: string | null;
  };
  userEmail?: string | null;
  userPhone?: string | null;
  occurredAt: string;
}

/**
 * Forwards a server-side conversion event to the ad platforms so campaign
 * optimization sees registrations/FTDs even when the browser pixel never
 * fires (ad blockers, iOS ITP, PWA standalone mode). Every attempt — sent,
 * failed, or skipped because credentials aren't configured — is logged to
 * tracking_delivery_logs (PRD sec. 9.3/9.4 step "enviar eventos para Meta,
 * Google e TikTok").
 *
 * Only real, documented endpoints are used here; nothing is invented.
 * Google Ads offline conversions require the full Google Ads API client
 * (OAuth refresh tokens, developer token) which is out of scope for this
 * scaffold — that destination always logs "skipped_not_configured" until
 * that integration is built.
 */
export async function forwardConversionEvent(params: ForwardConversionParams) {
  await Promise.all([
    forwardToMeta(params),
    forwardToTikTok(params),
    logDelivery(params.trackingEventId, "google", "skipped_not_configured", null, "Google Ads API client not implemented"),
  ]);
}

async function forwardToMeta(params: ForwardConversionParams) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return logDelivery(params.trackingEventId, "meta", "skipped_not_configured", null, "META_PIXEL_ID/META_ACCESS_TOKEN not set");
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        data: [
          {
            event_name: params.eventName,
            event_time: Math.floor(new Date(params.occurredAt).getTime() / 1000),
            action_source: "website",
            user_data: {
              fbc: params.attribution.fbc ?? undefined,
              fbp: params.attribution.fbp ?? undefined,
            },
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => null);
    return logDelivery(params.trackingEventId, "meta", response.ok ? "sent" : "failed", payload, response.ok ? null : `HTTP ${response.status}`);
  } catch (error) {
    return logDelivery(params.trackingEventId, "meta", "failed", null, (error as Error).message);
  }
}

async function forwardToTikTok(params: ForwardConversionParams) {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken || !params.attribution.ttclid) {
    return logDelivery(params.trackingEventId, "tiktok", "skipped_not_configured", null, "TIKTOK credentials or ttclid missing");
  }

  try {
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": accessToken },
      body: JSON.stringify({
        pixel_code: pixelId,
        event: params.eventName,
        timestamp: params.occurredAt,
        context: { ad: { callback: params.attribution.ttclid } },
      }),
    });

    const payload = await response.json().catch(() => null);
    return logDelivery(params.trackingEventId, "tiktok", response.ok ? "sent" : "failed", payload, response.ok ? null : `HTTP ${response.status}`);
  } catch (error) {
    return logDelivery(params.trackingEventId, "tiktok", "failed", null, (error as Error).message);
  }
}

async function logDelivery(
  trackingEventId: string,
  destination: string,
  status: string,
  responsePayload: unknown,
  errorMessage: string | null
) {
  const admin = createAdminSupabaseClient();
  await admin.from("tracking_delivery_logs").insert({
    tracking_event_id: trackingEventId,
    destination,
    status,
    response_payload: responsePayload,
    error_message: errorMessage,
  });
}
