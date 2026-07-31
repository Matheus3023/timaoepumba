import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { trackServerEvent } from "@/lib/tracking/events";

const bodySchema = z.object({
  fcm_token: z.string().min(20),
  device: z.string().optional(),
  browser: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: subscription, error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        fcm_token: parsed.data.fcm_token,
        device: parsed.data.device ?? null,
        browser: parsed.data.browser ?? null,
        status: "active",
      },
      { onConflict: "fcm_token" }
    )
    .select("id")
    .single();

  if (error || !subscription) {
    await trackServerEvent({ eventName: "PushSubscriptionFailed", userId: user.id });
    return NextResponse.json({ error: "subscription_failed" }, { status: 500 });
  }

  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("user_profiles")
      .update({ push_subscription_id: subscription.id, push_subscription_created_at: now })
      .eq("user_id", user.id),
    logTimelineEvent({
      userId: user.id,
      eventType: "push_subscription_created",
      description: "Assinatura de notificacoes push criada",
    }),
    trackServerEvent({ eventName: "PushSubscriptionCreated", userId: user.id }),
  ]);

  return NextResponse.json({ ok: true, subscription_id: subscription.id });
}
