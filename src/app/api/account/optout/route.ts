import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";

const bodySchema = z.object({ opted_out: z.boolean() });

/** Marketing opt-out / opt-in toggle (PRD sec. 19.6). */
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

  if (parsed.data.opted_out) {
    await Promise.all([
      admin.from("marketing_optouts").insert({ user_id: user.id, reason: "user_request" }),
      admin.from("consents").insert({ user_id: user.id, consent_type: "marketing", granted: false }),
      logTimelineEvent({ userId: user.id, eventType: "marketing_optout", description: "Optou por sair de comunicacoes promocionais" }),
    ]);
  } else {
    await Promise.all([
      admin.from("consents").insert({ user_id: user.id, consent_type: "marketing", granted: true }),
      logTimelineEvent({ userId: user.id, eventType: "marketing_optin", description: "Reativou comunicacoes promocionais" }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
