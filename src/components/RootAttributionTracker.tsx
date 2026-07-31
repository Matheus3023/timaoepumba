"use client";

import { useEffect } from "react";
import { detectBrowser, detectDevice, detectOS, isRunningStandalone } from "@/lib/onboarding/deviceDetection";
import { useTrackEvent } from "@/lib/tracking/useTrackEvent";

const SESSION_FLUSHED_KEY = "ttp_session_flushed";

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem("ttp_visitor_id");
  if (existing) return existing;
  const generated = crypto.randomUUID();
  localStorage.setItem("ttp_visitor_id", generated);
  return generated;
}

/**
 * Mounted once in the root layout. Flushes the attribution cookies set by
 * middleware.ts into the database and fires a PageView / PWAOpenedStandalone
 * event. Uses sessionStorage as a light de-dupe guard so we don't hammer the
 * endpoint on every client-side navigation.
 */
export function RootAttributionTracker() {
  const trackEvent = useTrackEvent();

  useEffect(() => {
    trackEvent("PageView", { path: window.location.pathname });

    if (isRunningStandalone()) {
      trackEvent("PWAOpenedStandalone");
      fetch("/api/onboarding/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "standalone_open" }),
      }).catch(() => {});
    }

    if (sessionStorage.getItem(SESSION_FLUSHED_KEY)) return;
    sessionStorage.setItem(SESSION_FLUSHED_KEY, "1");

    fetch("/api/tracking/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: getOrCreateVisitorId(),
        previous_page: document.referrer || undefined,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
      }),
    }).catch(() => {
      // best-effort
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
