import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { trackServerEvent } from "@/lib/tracking/events";

const bodySchema = z.object({ skipped: z.boolean().default(false) });

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  const skipped = parsed.success ? parsed.data.skipped : false;

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  await admin
    .from("user_profiles")
    .update({
      onboarding_completed: true,
      onboarding_completed_at: skipped ? null : now,
      onboarding_skipped_at: skipped ? now : null,
      onboarding_step: "done",
    })
    .eq("user_id", user.id);

  await Promise.all([
    logTimelineEvent({
      userId: user.id,
      eventType: "onboarding_completed",
      description: skipped ? "Pulou o onboarding" : "Concluiu o onboarding",
    }),
    trackServerEvent({ eventName: "OnboardingCompleted", userId: user.id, properties: { skipped } }),
  ]);

  return NextResponse.json({ ok: true });
}
