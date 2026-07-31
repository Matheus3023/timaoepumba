import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";

const bodySchema = z.object({
  favorite_team_id: z.string().uuid().nullable().optional(),
  favorite_leagues: z.array(z.string()).optional(),
  alert_preferences: z
    .object({
      new_analysis: z.boolean(),
      match_start: z.boolean(),
      live_goals: z.boolean(),
      community_news: z.boolean(),
      account_updates: z.boolean(),
    })
    .partial()
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("user_profiles")
    .update({
      ...(parsed.data.favorite_team_id !== undefined && {
        favorite_team_id: parsed.data.favorite_team_id,
      }),
      ...(parsed.data.favorite_leagues !== undefined && {
        favorite_leagues: parsed.data.favorite_leagues,
      }),
      ...(parsed.data.alert_preferences !== undefined && {
        alert_preferences: parsed.data.alert_preferences,
      }),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await logTimelineEvent({
    userId: user.id,
    eventType: "personalization_saved",
    description: "Personalizou preferencias esportivas e de alertas",
  });

  return NextResponse.json({ ok: true });
}
