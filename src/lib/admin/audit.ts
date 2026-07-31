import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Writes an immutable audit trail entry (PRD sec. 37) for an administrative
 * action. Called from server actions right after the mutation succeeds —
 * never blocks the action on failure, just logs to console like the rest of
 * this codebase's fire-and-forget writes (crm timeline, tracking events).
 */
export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_id: params.actorId,
    actor_type: "admin",
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) {
    console.error("[audit] failed to log action", params.action, error);
  }
}
