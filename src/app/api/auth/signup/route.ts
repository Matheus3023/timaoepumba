import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { attachUserIdToLead } from "@/lib/tracking/persistAttribution";
import { trackServerEvent } from "@/lib/tracking/events";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { moveUserToStage } from "@/lib/crm/pipeline";
import { calculateAge, MINIMUM_AGE, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

const bodySchema = z.object({
  full_name: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(72),
  date_of_birth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid_date"),
  age_confirmed: z.literal(true),
  terms_accepted: z.literal(true),
  privacy_accepted: z.literal(true),
  marketing_consent: z.boolean(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (calculateAge(payload.date_of_birth) < MINIMUM_AGE) {
    return NextResponse.json({ error: "underage" }, { status: 403 });
  }

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value;
  if (!leadId) {
    return NextResponse.json({ error: "missing_lead_id" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (signUpError || !signUpData.user) {
    const status = signUpError?.status && signUpError.status >= 400 ? signUpError.status : 400;
    return NextResponse.json({ error: signUpError?.message ?? "signup_failed" }, { status });
  }

  const userId = signUpData.user.id;
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { error: userInsertError } = await admin.from("users").insert({
    id: userId,
    lead_id: leadId,
    email: payload.email,
    phone: payload.phone,
    full_name: payload.full_name,
    date_of_birth: payload.date_of_birth,
    age_confirmed: true,
    access_level: "APP_USER",
    status: "active",
    terms_accepted_version: TERMS_VERSION,
    terms_accepted_at: now,
    privacy_accepted_version: PRIVACY_VERSION,
    privacy_accepted_at: now,
  });

  if (userInsertError) {
    console.error("[signup] failed to insert users row", userInsertError);
    return NextResponse.json({ error: "profile_creation_failed" }, { status: 500 });
  }

  await Promise.all([
    admin.from("user_profiles").insert({ user_id: userId }),
    admin.from("user_preferences").insert({ user_id: userId }),
    admin.from("consents").insert([
      { user_id: userId, consent_type: "terms", granted: true, version: TERMS_VERSION },
      { user_id: userId, consent_type: "privacy", granted: true, version: PRIVACY_VERSION },
      { user_id: userId, consent_type: "marketing", granted: payload.marketing_consent, version: TERMS_VERSION },
    ]),
    attachUserIdToLead(leadId, userId),
  ]);

  // Automations sec. 19.1 "Conta criada"
  await Promise.all([
    moveUserToStage(userId, "Conta criada"),
    logTimelineEvent({
      userId,
      eventType: "account_created",
      description: "Criou a conta no aplicativo",
    }),
    trackServerEvent({ eventName: "AppRegistrationCompleted", leadId, userId }),
    admin.from("automation_runs").insert({
      automation_key: "account_created",
      user_id: userId,
      status: "success",
      details: { lead_id: leadId },
    }),
  ]);

  return NextResponse.json({ ok: true, user_id: userId });
}
