"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (public/sw.js) — required for installability and push. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("[pwa] service worker registration failed", error);
      });
    }
  }, []);

  return null;
}
