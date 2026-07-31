import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * NEVER import this file from a Client Component or expose its output to
 * the browser. It exists only for: webhook handlers, admin panel server
 * actions/routes, and background jobs that need cross-user access.
 * The `server-only` import makes any accidental client-side import a
 * build-time error.
 */
export function createAdminSupabaseClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
