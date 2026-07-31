import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PushCategory = "transactional" | "content" | "community" | "promotional";

export type SuppressionReason = "NO_CONSENT" | "USER_RESTRICTED" | "USER_SUSPENDED" | "FREQUENCY_LIMIT" | "QUIET_HOURS";

export interface EligibilityResult {
  eligible: boolean;
  reason?: SuppressionReason;
}

/** PRD sec. 17.1 — editorial/community get a looser daily cap than promotional; transactional is never capped. */
const FREQUENCY_CAP_PER_DAY: Record<Exclude<PushCategory, "transactional">, number> = {
  content: 3,
  community: 3,
  promotional: 1,
};

const QUIET_HOURS_START = 8;
const QUIET_HOURS_END = 22;
const QUIET_HOURS_TIMEZONE = "America/Sao_Paulo";

function isWithinAllowedHours(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: QUIET_HOURS_TIMEZONE }).format(new Date())
  );
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;
}

/**
 * Runs the mandatory checks (PRD sec. 14.1) before a push is sent.
 * Transactional pushes only respect the restricted/suspended check — every
 * other category respects consent (promotional), quiet hours, and the
 * per-category frequency cap (PRD sec. 17), matching "todo contato pode
 * receber comunicacoes essenciais relacionadas a conta, seguranca e
 * funcionamento do aplicativo" (sec. 2).
 */
export async function evaluateContactEligibility(userId: string, category: PushCategory): Promise<EligibilityResult> {
  const admin = createAdminSupabaseClient();

  const { data: user } = await admin.from("users").select("access_level, status").eq("id", userId).maybeSingle();
  if (!user || user.status !== "active") {
    return { eligible: false, reason: "USER_SUSPENDED" };
  }
  if (user.access_level === "RESTRICTED_USER" && category !== "transactional") {
    return { eligible: false, reason: "USER_RESTRICTED" };
  }
  if (category === "transactional") {
    return { eligible: true };
  }

  if (category === "promotional") {
    const { data: optOut } = await admin.from("marketing_optouts").select("user_id").eq("user_id", userId).maybeSingle();
    if (optOut) return { eligible: false, reason: "NO_CONSENT" };
  }

  if (!isWithinAllowedHours()) {
    return { eligible: false, reason: "QUIET_HOURS" };
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("push_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["sent", "delivered", "opened", "clicked"])
    .gte("sent_at", since);

  if ((count ?? 0) >= FREQUENCY_CAP_PER_DAY[category]) {
    return { eligible: false, reason: "FREQUENCY_LIMIT" };
  }

  return { eligible: true };
}
