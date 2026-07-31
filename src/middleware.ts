import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  LEAD_ID_COOKIE,
  generateLeadId,
} from "@/lib/tracking/leadId";
import { extractAttributionFromSearchParams } from "@/lib/tracking/attribution";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Runs on every request. Responsible for:
 *  - assigning a Lead ID that follows the visitor across the whole journey
 *    (PRD sec. 5.2), persisted regardless of whether an account is ever
 *    created;
 *  - capturing first-touch and last-touch campaign attribution from the
 *    URL (PRD sec. 6), stored in cookies so it survives navigation and is
 *    later flushed to Postgres (attribution_data) by /api/tracking/session
 *    once we know which lead_id/user it belongs to.
 *
 * This never talks to the database directly (middleware runs on the Edge
 * runtime) — it only manages cookies. Persistence happens server-side in
 * API routes that read these cookies.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { searchParams, pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api/webhooks")) {
    return response;
  }

  // Refresh the Supabase auth session cookie on every request (required by
  // @supabase/ssr so server components always see a valid session).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    await supabase.auth.getUser();
  }

  let leadId = request.cookies.get(LEAD_ID_COOKIE)?.value;
  if (!leadId) {
    leadId = generateLeadId();
    response.cookies.set(LEAD_ID_COOKIE, leadId, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
    });
  }

  const attribution = extractAttributionFromSearchParams(searchParams);
  if (attribution) {
    attribution.entry_page = pathname;
    const serialized = JSON.stringify(attribution);

    response.cookies.set(LAST_TOUCH_COOKIE, serialized, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
    });

    if (!request.cookies.get(FIRST_TOUCH_COOKIE)?.value) {
      response.cookies.set(FIRST_TOUCH_COOKIE, serialized, {
        maxAge: ONE_YEAR_SECONDS,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons).*)",
};
