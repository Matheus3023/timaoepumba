import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE, LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { persistAttributionTouch, recordAcquisitionSession } from "@/lib/tracking/persistAttribution";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AttributionSnapshot } from "@/lib/tracking/attribution";

const bodySchema = z.object({
  visitor_id: z.string().min(1),
  previous_page: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

function safeParseSnapshot(raw: string | undefined): AttributionSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttributionSnapshot;
  } catch {
    return null;
  }
}

/**
 * Called once per app session (see RootAttributionTracker) to flush the
 * first/last-touch cookies set by middleware.ts into Postgres, and to log
 * an acquisition_sessions row (PRD sec. 6.1/6.2).
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value;
  if (!leadId) {
    return NextResponse.json({ error: "missing_lead_id" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstTouch = safeParseSnapshot(request.cookies.get(FIRST_TOUCH_COOKIE)?.value);
  const lastTouch = safeParseSnapshot(request.cookies.get(LAST_TOUCH_COOKIE)?.value);

  await Promise.all([
    firstTouch
      ? persistAttributionTouch({
          leadId,
          userId: user?.id,
          touchType: "first",
          snapshot: firstTouch,
        })
      : Promise.resolve(),
    lastTouch
      ? persistAttributionTouch({
          leadId,
          userId: user?.id,
          touchType: "last",
          snapshot: lastTouch,
        })
      : Promise.resolve(),
    recordAcquisitionSession({
      leadId,
      userId: user?.id,
      visitorId: parsed.data.visitor_id,
      entryPage: lastTouch?.entry_page ?? request.nextUrl.pathname,
      previousPage: parsed.data.previous_page,
      device: parsed.data.device,
      browser: parsed.data.browser,
      os: parsed.data.os,
      userAgent: request.headers.get("user-agent"),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
