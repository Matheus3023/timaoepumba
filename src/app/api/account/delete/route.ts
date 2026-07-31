import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";

/** Account deletion request (PRD sec. 8.2/25). Soft-deletes and signs the user out immediately. */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  await Promise.all([
    admin.from("users").update({ status: "pending_deletion" }).eq("id", user.id),
    admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "account_deletion_requested",
      entity_type: "users",
      entity_id: user.id,
    }),
    logTimelineEvent({ userId: user.id, eventType: "account_deletion_requested", description: "Solicitou exclusao da conta" }),
  ]);

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
