import { NextResponse, type NextRequest } from "next/server";
import { runInactivityAutomation } from "@/lib/automations/reactivation";

/**
 * Triggers the D3/D7/D15 reactivation automation (PRD sec. 19.5). Meant to
 * be called on a daily schedule by an external scheduler (n8n per the PRD's
 * recommended stack, or Vercel Cron) — not by end users, hence the shared
 * secret instead of a user session check.
 *
 * curl -X POST https://.../api/automations/run-inactivity \
 *   -H "X-Automation-Secret: $AUTOMATIONS_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const secret = process.env.AUTOMATIONS_CRON_SECRET;
  const provided = request.headers.get("x-automation-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runInactivityAutomation();
  return NextResponse.json({ ok: true, summary });
}
