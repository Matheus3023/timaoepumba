import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  event_name: z.string().min(1).max(120),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value ?? null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await trackServerEvent({
    eventName: parsed.data.event_name,
    leadId,
    userId: user?.id ?? null,
    properties: parsed.data.properties,
  });

  return NextResponse.json({ ok: true });
}
