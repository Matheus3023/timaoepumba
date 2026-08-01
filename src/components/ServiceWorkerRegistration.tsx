"use client";

import { useEffect } from "react";

const PERIODIC_UPDATE_CHECK_MS = 60_000;

/**
 * Registers the PWA service worker (public/sw.js) — required for
 * installability and push — and makes sure a newly deployed sw.js takes
 * over promptly instead of the app being stuck on a stale cached version:
 * checks for an update immediately, every time the app regains focus (the
 * common case for an installed PWA reopened from the background), and on
 * a 60s interval while open (visibilitychange isn't reliably fired by
 * every installed-PWA wrapper, so this is a belt-and-suspenders backstop).
 * Reloads once when the new worker actually takes control.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;
    function handleControllerChange() {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[pwa] service worker registration failed", error);
    });

    function checkForUpdate() {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.update().catch(() => {});
      });
    }
    checkForUpdate();
    document.addEventListener("visibilitychange", checkForUpdate);
    const interval = setInterval(checkForUpdate, PERIODIC_UPDATE_CHECK_MS);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      clearInterval(interval);
    };
  }, []);

  return null;
}
