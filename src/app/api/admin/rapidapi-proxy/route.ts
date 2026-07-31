import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, resolveAdminAccess } from "@/lib/admin/access";

const bodySchema = z.object({
  path: z.string().min(1).max(200),
  query: z.record(z.string(), z.string()).optional(),
});

/**
 * Admin-only debug proxy to the Flashscore4/RapidAPI. Exists purely to let
 * an admin discover real endpoint paths and response shapes from inside
 * the deployed app (which has normal internet access) — the RAPIDAPI_KEY
 * never reaches the browser, only the JSON result does.
 */
export async function POST(request: NextRequest) {
  const access = await resolveAdminAccess();
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!canWrite(access, "dados_esportivos")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;
  if (!apiKey || !apiHost) {
    return NextResponse.json({ error: "rapidapi_not_configured" }, { status: 500 });
  }

  const cleanPath = parsed.data.path.replace(/^\/+/, "");
  const url = new URL(`https://${apiHost}/api/flashscore/v2/${cleanPath}`);
  for (const [key, value] of Object.entries(parsed.data.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const admin = createAdminSupabaseClient();
  const startedAt = Date.now();

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": apiHost,
        "x-rapidapi-key": apiKey,
      },
      cache: "no-store",
    });

    const durationMs = Date.now() - startedAt;
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // leave as raw text — not every response is JSON
    }

    await admin.from("sports_api_logs").insert({
      endpoint: cleanPath,
      status_code: response.status,
      success: response.ok,
      duration_ms: durationMs,
      error_message: response.ok ? null : `HTTP ${response.status}`,
    });

    return NextResponse.json({
      requested_url: url.toString().replace(apiKey, "***"),
      status: response.status,
      ok: response.ok,
      duration_ms: durationMs,
      body,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await admin.from("sports_api_logs").insert({
      endpoint: cleanPath,
      success: false,
      duration_ms: durationMs,
      error_message: (error as Error).message,
    });
    return NextResponse.json(
      { error: "fetch_failed", message: (error as Error).message },
      { status: 502 }
    );
  }
}
