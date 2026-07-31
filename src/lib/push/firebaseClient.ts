"use client";

import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getMessaging, getToken, type Messaging } from "firebase/messaging";

function getFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  const config = getFirebaseConfig();
  if (!config) return null;

  if (!messagingInstance) {
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

/**
 * Requests an FCM registration token for this browser. Returns null when
 * Firebase isn't configured (dev/staging without credentials) or the
 * browser denies/lacks push support — callers should treat that as a
 * graceful "unavailable", not a hard error.
 */
export async function getFcmToken(): Promise<string | null> {
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token || null;
  } catch (error) {
    console.error("[push] failed to get FCM token", error);
    return null;
  }
}
