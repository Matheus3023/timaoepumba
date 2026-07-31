"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// NEXT_PUBLIC_* values only get inlined into the browser bundle when
// referenced as a literal `process.env.NEXT_PUBLIC_X` expression — Next.js
// replaces that exact pattern at build time. Routing this through a helper
// that does `process.env[name]` (a dynamic lookup) defeats that static
// replacement, so it must NOT go through lib/env.ts's requireEnv() here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in the client bundle"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
