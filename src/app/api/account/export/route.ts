import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Data export request (PRD sec. 25 "exportacao de dados"). */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [userRow, profile, consents, timeline] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("consents").select("*").eq("user_id", user.id),
    supabase.from("crm_timeline_events").select("*").eq("user_id", user.id).order("occurred_at"),
  ]);

  return NextResponse.json({
    user: userRow.data,
    profile: profile.data,
    consents: consents.data,
    timeline: timeline.data,
    exported_at: new Date().toISOString(),
  });
}
