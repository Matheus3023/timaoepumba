import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
  );
}

function getFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel/most env stores escape newlines; restore them.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * Sends a push notification to every active subscription a user has
 * (PRD sec. 17). Silently no-ops when Firebase credentials aren't
 * configured (local/dev), so callers never need to guard this themselves.
 */
export async function sendPushToUser(
  userId: string,
  notification: { title: string; body: string; link?: string }
): Promise<{ sent: number; failed: number }> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("[push] Firebase Admin not configured — skipping send");
    return { sent: 0, failed: 0 };
  }

  const admin = createAdminSupabaseClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, fcm_token")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const messaging = getMessaging(getFirebaseAdminApp());
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await messaging.send({
          token: sub.fcm_token,
          notification: { title: notification.title, body: notification.body },
          webpush: notification.link ? { fcmOptions: { link: notification.link } } : undefined,
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[push] failed to send to subscription ${sub.id}`, error);
        await admin.from("push_subscriptions").update({ status: "failed" }).eq("id", sub.id);
      }
    })
  );

  return { sent, failed };
}
