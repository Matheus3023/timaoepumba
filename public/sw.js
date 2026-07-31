const CACHE_NAME = "ttp-shell-v1";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Network-first with cache fallback. Required for installability (Chrome
// checks for a fetch handler) and gives a minimal offline shell, per PRD
// sec. 12.5 "evitar que o aplicativo fique completamente fora do ar".
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only cache same-origin http(s) GETs — the Cache API rejects other
  // schemes (chrome-extension:, moz-extension:, etc.) that browser
  // extensions can trigger fetches for.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});

// Handles push notifications sent via FCM (see src/lib/push/fcm.ts) or any
// standard Web Push payload. Supports both the FCM "notification" shape
// and a flat {title, body} shape.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "Timao e Pumba Tips", body: event.data.text() } };
  }

  const notification = payload.notification ?? payload;
  const title = notification.title ?? "Timao e Pumba Tips";
  const options = {
    body: notification.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link: payload.fcmOptions?.link ?? payload.data?.link ?? "/home" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/home";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(link) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    })
  );
});
