import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { canWrite, resolveAdminAccess } from "@/lib/admin/access";

const bodySchema = z.object({
  path: z.string().min(1).max(200),
  method: z.enum(["GET", "POST"]).default("GET"),
  query: z.record(z.string(), z.string()).optional(),
  authMode: z.enum(["header", "query"]).default("header"),
  authKeyName: z.string().min(1).max(100).default("api-key"),
});

/**
 * Admin-only debug proxy to the Smartico Operator API (TAP BackOffice).
 * Exists purely to let an admin discover the real endpoint paths and auth
 * convention from inside the deployed app — SMARTICO_API_KEY never reaches
 * the browser, only the JSON result does. Base URL and auth placement are
 * still unconfirmed for this account, so both are adjustable per-request
 * instead of hardcoded (unlike the Flashscore proxy, which already has a
 * confirmed contract).
 */
export async function POST(request: NextRequest) {
  const access = await resolveAdminAccess();
  if (access === "unauthenticated" || access === "not_admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (access === "error") {
    return NextResponse.json({ error: "admin_access_check_failed" }, { status: 500 });
  }
  if (!canWrite(access, "afiliados")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const apiKey = process.env.SMARTICO_API_KEY;
  const baseUrl = process.env.SMARTICO_BASE_URL || "https://boapi.smartico.ai";
  if (!apiKey) {
    return NextResponse.json({ error: "smartico_not_configured" }, { status: 500 });
  }

  const cleanPath = parsed.data.path.replace(/^\/+/, "");
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/${cleanPath}`);
  for (const [key, value] of Object.entries(parsed.data.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (parsed.data.authMode === "header") {
    headers[parsed.data.authKeyName] = apiKey;
  } else {
    url.searchParams.set(parsed.data.authKeyName, apiKey);
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url.toString(), {
      method: parsed.data.method,
      headers,
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

    return NextResponse.json({
      requested_url: url.toString().replace(apiKey, "***"),
      status: response.status,
      ok: response.ok,
      duration_ms: durationMs,
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "fetch_failed", message: (error as Error).message },
      { status: 502 }
    );
  }
}
