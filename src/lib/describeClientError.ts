"use client";

/**
 * Turns a thrown error into a message that includes enough detail to
 * diagnose remotely (exact error text + which Supabase URL the browser
 * bundle actually has baked in) without requiring the user to open
 * DevTools. Temporary diagnostic aid — safe to keep, but the extra detail
 * is mainly useful while debugging deployment/env issues.
 */
export function describeClientError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "(nao configurada)";
  return `Nao foi possivel conectar. Detalhe: ${detail} — URL configurada: ${configuredUrl}`;
}
