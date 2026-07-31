import { NextResponse, type NextRequest } from "next/server";
import { LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildAffiliateUrl } from "@/lib/affiliate/linkBuilder";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { moveUserToStage } from "@/lib/crm/pipeline";
import { trackServerEvent } from "@/lib/tracking/events";

/**
 * Redirect endpoint used by the "Cadastre-se na casa parceira" button
 * (PRD sec. 9.1). Generates the affiliate URL with the user's Lead ID as
 * subid, logs the click for attribution/CRM, and 302s the browser there.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value;
  if (!leadId) {
    return NextResponse.redirect(new URL("/home?affiliate_error=missing_lead_id", request.url));
  }

  const admin = createAdminSupabaseClient();
  const { data: config } = await admin
    .from("affiliate_configurations")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!config) {
    return NextResponse.redirect(new URL("/home?affiliate_error=not_configured", request.url));
  }

  const generatedUrl = buildAffiliateUrl(config, leadId);

  await Promise.all([
    admin.from("affiliate_clicks").insert({
      user_id: user.id,
      lead_id: leadId,
      affiliate_configuration_id: config.id,
      generated_url: generatedUrl,
    }),
    moveUserToStage(user.id, "Clicou na casa"),
    logTimelineEvent({
      userId: user.id,
      eventType: "affiliate_click",
      description: "Clicou no cadastro da casa parceira",
    }),
    trackServerEvent({ eventName: "SportsbookLinkClicked", leadId, userId: user.id }),
    admin.from("automation_runs").insert({
      automation_key: "affiliate_clicked",
      user_id: user.id,
      status: "success",
      details: { affiliate_configuration_id: config.id },
    }),
  ]);

  return NextResponse.redirect(generatedUrl);
}
