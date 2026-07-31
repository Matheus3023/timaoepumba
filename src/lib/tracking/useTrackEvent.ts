"use client";

import { useCallback } from "react";
import type { TrackingEventName } from "@/lib/tracking/events";

/**
 * Client-side event tracking hook. Posts to /api/tracking/event, which
 * persists the event server-side (lead_id/user_id are resolved there from
 * the request's cookies/session, never trusted from the client payload).
 */
export function useTrackEvent() {
  return useCallback((eventName: TrackingEventName, properties?: Record<string, unknown>) => {
    const body = JSON.stringify({ event_name: eventName, properties: properties ?? {} });

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/tracking/event", blob);
      return;
    }

    fetch("/api/tracking/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // best-effort — tracking failures must never break the UI
    });
  }, []);
}
