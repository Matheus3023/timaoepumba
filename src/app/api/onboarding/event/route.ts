import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordOnboardingEvent, type OnboardingEventType } from "@/lib/onboarding/onboardingEvents";

const EVENT_TYPES = [
  "install_prompt_viewed",
  "install_button_clicked",
  "install_accepted",
  "install_dismissed",
  "install_unavailable",
  "standalone_open",
  "notif_prompt_viewed",
  "notif_permission_button_clicked",
  "notif_granted",
  "notif_denied",
  "notif_dismissed",
  "notif_unsupported",
] as const satisfies readonly OnboardingEventType[];

const bodySchema = z.object({ type: z.enum(EVENT_TYPES) });

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

  await recordOnboardingEvent(user.id, parsed.data.type);

  return NextResponse.json({ ok: true });
}
