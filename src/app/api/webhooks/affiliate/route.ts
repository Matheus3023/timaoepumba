import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/affiliate/webhookSecurity";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { moveUserToStage } from "@/lib/crm/pipeline";
import { promoteAccessLevel } from "@/lib/entitlements/rules";
import { trackServerEvent } from "@/lib/tracking/events";
import { forwardConversionEvent } from "@/lib/adsConversions/forwardConversion";
import { sendPushToUser } from "@/lib/push/fcm";

const payloadSchema = z.object({
  event: z.enum(["registration", "ftd"]),
  subid: z.string().min(1),
  transaction_id: z.string().min(1),
  timestamp: z.string(),
});

/**
 * Affiliate postback endpoint (PRD sec. 9.3 "registration" and 9.4 "ftd").
 * Both event types share one endpoint, mirroring the PRD's example
 * payloads — differentiated by the `event` field.
 *
 * POST /api/webhooks/affiliate
 * Headers: X-Webhook-Key, X-Webhook-Signature (hex HMAC-SHA256 of the raw body)
 */
export async function POST(request: NextRequest) {
  const admin = createAdminSupabaseClient();
  const rawBody = await request.text();
  const webhookKey = request.headers.get("x-webhook-key");
  const signature = request.headers.get("x-webhook-signature");

  // 1. Resolve which affiliate configuration this postback belongs to.
  const { data: config } = webhookKey
    ? await admin.from("affiliate_configurations").select("*").eq("webhook_key", webhookKey).maybeSingle()
    : { data: null };

  if (!config) {
    await admin.from("affiliate_webhook_logs").insert({
      affiliate_configuration_id: null,
      status_code: 404,
      request_headers: Object.fromEntries(request.headers.entries()),
      request_body: safeJson(rawBody),
      validation_result: "unknown_webhook_key",
    });
    return NextResponse.json({ error: "unknown_webhook_key" }, { status: 404 });
  }

  // 2. Validate the signature (PRD: "validar o segredo").
  const validSignature = verifyWebhookSignature(rawBody, config.webhook_secret, signature);
  if (!validSignature) {
    await admin.from("affiliate_webhook_logs").insert({
      affiliate_configuration_id: config.id,
      status_code: 401,
      request_headers: Object.fromEntries(request.headers.entries()),
      request_body: safeJson(rawBody),
      validation_result: "invalid_signature",
    });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 3. Validate payload shape.
  const parsed = payloadSchema.safeParse(safeJson(rawBody));
  if (!parsed.success) {
    await admin.from("affiliate_webhook_logs").insert({
      affiliate_configuration_id: config.id,
      status_code: 400,
      request_headers: Object.fromEntries(request.headers.entries()),
      request_body: safeJson(rawBody),
      validation_result: "invalid_payload",
    });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { event, subid, transaction_id, timestamp } = parsed.data;

  await admin.from("affiliate_webhook_logs").insert({
    affiliate_configuration_id: config.id,
    status_code: 200,
    request_headers: Object.fromEntries(request.headers.entries()),
    request_body: parsed.data,
    validation_result: "ok",
  });

  // 4. Idempotency: unique(event_type, transaction_id) rejects duplicates.
  const { data: affiliateEvent, error: insertError } = await admin
    .from("affiliate_events")
    .insert({
      affiliate_configuration_id: config.id,
      lead_id: subid,
      event_type: event,
      transaction_id,
      raw_payload: parsed.data,
      status: "processed",
    })
    .select("id")
    .single();

  if (insertError) {
    // unique violation => duplicate postback, acknowledge without reprocessing
    return NextResponse.json({ ok: true, status: "duplicate" });
  }

  // 5. Locate the user by lead_id (subid).
  const { data: user } = await admin.from("users").select("id, email, phone").eq("lead_id", subid).maybeSingle();

  if (!user) {
    await admin.from("affiliate_events").update({ status: "rejected" }).eq("id", affiliateEvent.id);
    return NextResponse.json({ error: "user_not_found" }, { status: 200 });
  }

  await admin.from("affiliate_events").update({ user_id: user.id }).eq("id", affiliateEvent.id);

  const { data: attribution } = await admin
    .from("attribution_data")
    .select("fbc, fbp, gclid, ttclid")
    .eq("lead_id", subid)
    .eq("touch_type", "last")
    .maybeSingle();

  if (event === "registration") {
    await handleRegistration({ user, config, affiliateEventId: affiliateEvent.id, subid, timestamp, attribution });
  } else {
    await handleFtd({ user, config, affiliateEventId: affiliateEvent.id, subid, timestamp, attribution });
  }

  return NextResponse.json({ ok: true });
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface HandlerParams {
  user: { id: string; email: string; phone: string | null };
  config: { id: string };
  affiliateEventId: string;
  subid: string;
  timestamp: string;
  attribution: { fbc?: string | null; fbp?: string | null; gclid?: string | null; ttclid?: string | null } | null;
}

async function handleRegistration({ user, config, affiliateEventId, subid, timestamp, attribution }: HandlerParams) {
  const admin = createAdminSupabaseClient();

  await admin.from("registrations").insert({
    user_id: user.id,
    affiliate_configuration_id: config.id,
    affiliate_event_id: affiliateEventId,
    confirmed_at: timestamp,
  });

  await promoteAccessLevel(user.id, "REGISTERED_USER");
  await moveUserToStage(user.id, "Comunidade liberada");

  await Promise.all([
    logTimelineEvent({ userId: user.id, eventType: "registration_confirmed", description: "Cadastro confirmado" }),
    admin.from("automation_runs").insert({
      automation_key: "registration_confirmed",
      user_id: user.id,
      status: "success",
      details: { affiliate_event_id: affiliateEventId },
    }),
  ]);

  const trackingEventId = await trackServerEvent({
    eventName: "SportsbookRegistrationConfirmed",
    leadId: subid,
    userId: user.id,
  });
  await trackServerEvent({ eventName: "CommunityAccessGranted", leadId: subid, userId: user.id });

  if (trackingEventId) {
    await forwardConversionEvent({
      trackingEventId,
      eventName: "SportsbookRegistrationConfirmed",
      attribution: attribution ?? {},
      userEmail: user.email,
      userPhone: user.phone,
      occurredAt: timestamp,
    });
  }
}

async function handleFtd({ user, config, affiliateEventId, subid, timestamp, attribution }: HandlerParams) {
  const admin = createAdminSupabaseClient();

  await admin.from("ftds").insert({
    user_id: user.id,
    affiliate_configuration_id: config.id,
    affiliate_event_id: affiliateEventId,
    confirmed_at: timestamp,
  });

  await promoteAccessLevel(user.id, "FTD_USER");
  await moveUserToStage(user.id, "Usuario ativo");

  await Promise.all([
    logTimelineEvent({ userId: user.id, eventType: "ftd_confirmed", description: "FTD confirmado" }),
    admin.from("automation_runs").insert({
      automation_key: "ftd_confirmed",
      user_id: user.id,
      status: "success",
      details: { affiliate_event_id: affiliateEventId },
    }),
    sendPushToUser(user.id, {
      title: "Deposito confirmado!",
      body: "Novos recursos foram liberados na sua conta.",
      link: "/perfil",
    }),
    notifyInternalTeam(`FTD confirmado para o usuario ${user.id} (lead ${subid}).`),
  ]);

  const trackingEventId = await trackServerEvent({ eventName: "FTDConfirmed", leadId: subid, userId: user.id });

  if (trackingEventId) {
    await forwardConversionEvent({
      trackingEventId,
      eventName: "FTDConfirmed",
      attribution: attribution ?? {},
      userEmail: user.email,
      userPhone: user.phone,
      occurredAt: timestamp,
    });
  }
}

async function notifyInternalTeam(message: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (error) {
    console.error("[affiliate-webhook] failed to notify internal team via n8n", error);
  }
}

/**
 * Variante GET do postback, para plataformas que só sabem chamar URL.
 *
 * A TAP (plataforma do programa de afiliados da Bateu Bet) só oferece pixel
 * do tipo "S2S HTTP — Server-to-Server call with GET method": querystring,
 * sem corpo e sem header customizado. Não dá para exigir dela o
 * X-Webhook-Key/X-Webhook-Signature que o POST espera.
 *
 * Em vez de duplicar validação e auditoria, esta rota traduz a chamada GET
 * na mesma requisição POST que já sabemos tratar: monta o corpo canônico e
 * assina com o segredo QUE VEIO NA URL. Se o segredo estiver errado, a
 * assinatura não confere e o caminho POST devolve 401 — a validação continua
 * sendo uma só, e o log de webhook registra a tentativa do mesmo jeito.
 *
 * Formato esperado (o que se configura no painel da casa):
 *   GET /api/webhooks/affiliate
 *       ?key=<webhook_key>&secret=<webhook_secret>
 *       &event=registration|ftd
 *       &subid={{subid}}&transaction_id={{registration_id}}&timestamp={{...}}
 *
 * O segredo viaja na URL porque a plataforma não permite header. É aceitável
 * sobre HTTPS e é o padrão de postback do mercado, mas significa que ele vai
 * aparecer em log de acesso da casa — se vazar, rotacionar
 * `affiliate_configurations.webhook_secret` e reconfigurar o pixel lá.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const key = params.get("key");
  const secret = params.get("secret");
  if (!key || !secret) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const body = JSON.stringify({
    event: params.get("event"),
    subid: params.get("subid"),
    transaction_id: params.get("transaction_id"),
    timestamp: params.get("timestamp") ?? new Date().toISOString(),
  });

  const signature = createHmac("sha256", secret).update(body).digest("hex");

  return POST(
    new NextRequest(request.nextUrl, {
      method: "POST",
      body,
      headers: {
        "content-type": "application/json",
        "x-webhook-key": key,
        "x-webhook-signature": signature,
        // Preserva a origem real para o log de auditoria não registrar
        // toda chamada como se fosse interna.
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
        "user-agent": request.headers.get("user-agent") ?? "",
        "x-postback-transport": "get",
      },
    })
  );
}
