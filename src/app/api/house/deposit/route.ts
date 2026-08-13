import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HOUSE_TOKEN_COOKIE } from "@/lib/odds/houseSession";
import { createHouseDeposit } from "@/lib/odds/houseDeposit";
import { trackServerEvent } from "@/lib/tracking/events";

// A Bateu está atrás de Cloudflare e devolve 403 para IP de datacenter fora
// do Brasil — mesma armadilha do login. Fixamos a função em São Paulo (gru1)
// para a chamada de carteira sair de um IP brasileiro.
export const preferredRegion = "gru1";
export const runtime = "nodejs";

const bodySchema = z.object({
  value: z.number().positive().max(1_000_000),
  method: z.string().min(2).max(40).optional(),
});

/**
 * Gera um depósito PIX na conta da casa, por dentro do app.
 *
 * O usuário está logado com a conta da Bateu (login espelho) e o token dela
 * está no cookie httpOnly `tp_house_token`. Aqui recebemos só o valor, lemos
 * o token do cookie e pedimos o PIX à casa — o QR volta para o app exibir,
 * sem redirecionar o usuário para o site da casa.
 *
 * Exige sessão do app válida (o cookie da casa é httpOnly, mas confirmamos a
 * sessão do Supabase para não gerar cobrança a partir de token solto).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "nao_autenticado" }, { status: 401 });
  }

  const token = request.cookies.get(HOUSE_TOKEN_COOKIE)?.value ?? null;
  if (!token) {
    return NextResponse.json({ error: "sessao_casa_ausente" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "dados_invalidos" }, { status: 400 });
  }
  if (parsed.data.value < 10) {
    return NextResponse.json({ error: "valor_minimo", min: 10 }, { status: 400 });
  }

  const utmSource = request.cookies.get("utm_source")?.value ?? null;
  const gaClientId = request.cookies.get("_ga")?.value ?? null;

  const result = await createHouseDeposit({
    token,
    value: parsed.data.value,
    method: parsed.data.method,
    utmSource,
    gaClientId,
  });

  if (!result.ok) {
    await trackServerEvent({
      eventName: "HouseDepositFailed",
      userId: user.id,
      properties: { reason: result.reason, detail: result.detail, value: parsed.data.value },
    }).catch(() => {});
    // sessao_invalida (token recusado) → 401 para a UI mandar refazer login;
    // token_invalido/valor → 400; demais → 502. O `detail` sobe para depurar.
    const status =
      result.reason === "sessao_invalida"
        ? 401
        : result.reason === "token_invalido" || result.reason === "valor_invalido"
          ? 400
          : 502;
    return NextResponse.json({ error: result.reason, detail: result.detail ?? null }, { status });
  }

  await trackServerEvent({
    eventName: "HouseDepositCreated",
    userId: user.id,
    properties: { value: result.value, transactionId: result.transactionId },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    value: result.value,
    transactionId: result.transactionId,
    // EMV copia-e-cola; a imagem do QR é opcional (a UI pode gerar do EMV).
    brCode: result.brCode,
    qrCodeImage: result.qrCodeImage,
    checkoutUrl: result.checkoutUrl,
    paymentLink: result.paymentLink,
  });
}
