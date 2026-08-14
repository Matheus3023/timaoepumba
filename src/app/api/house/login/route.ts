import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { authenticateWithHouse } from "@/lib/odds/houseAuth";
import { HOUSE_TOKEN_COOKIE, HOUSE_SESSION_COOKIE } from "@/lib/odds/houseSession";
import { extractHouseIdentity, provisionAppUser } from "@/lib/odds/houseProvision";
import { LEAD_ID_COOKIE } from "@/lib/tracking/leadId";
import { promoteAccessLevel } from "@/lib/entitlements/rules";
import { trackServerEvent } from "@/lib/tracking/events";

// A Bateu está atrás de Cloudflare e devolve 403 para IP de datacenter fora
// do Brasil. Fixamos a função em São Paulo (gru1) para a chamada sair de um
// IP brasileiro — que é o que ela aceita (testado: BR = 422, US = 403).
export const preferredRegion = "gru1";
export const runtime = "nodejs";

const bodySchema = z.object({
  login: z.string().min(1).max(120),
  password: z.string().min(6).max(200),
});

/**
 * Login com a conta da casa — e ÚNICA porta de entrada do app.
 *
 * Não há mais cadastro no app: o usuário entra com email/CPF + senha da
 * conta da Bateu. Esta rota:
 *  1. valida na casa e pega o token de sessão;
 *  2. provisiona a conta do app a partir do que a casa devolveu (ver
 *     houseProvision) — sem o usuário nunca ter feito cadastro aqui;
 *  3. estabelece a sessão do app (signInWithPassword com a senha derivada);
 *  4. guarda só o token da casa num cookie httpOnly.
 *
 * A senha da casa nunca é gravada nem devolvida — morre nesta função.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "dados_invalidos" }, { status: 400 });
  }

  // 1. Autentica na casa.
  const auth = await authenticateWithHouse(parsed.data.login, parsed.data.password);
  if (!auth.ok) {
    await trackServerEvent({ eventName: "HouseLoginFailed", properties: { reason: auth.reason } }).catch(() => {});
    const status = auth.reason === "credenciais" ? 401 : 502;
    return NextResponse.json({ error: auth.reason }, { status });
  }

  // 2. Identidade a partir da resposta da casa.
  const identity = extractHouseIdentity(auth.raw ?? null, parsed.data.login);
  if (!identity) {
    console.error("[house-login] login ok mas sem email na resposta", auth.raw ? Object.keys(auth.raw) : null);
    return NextResponse.json({ error: "sem_email" }, { status: 502 });
  }

  const leadId = request.cookies.get(LEAD_ID_COOKIE)?.value ?? null;

  // 3. Provisiona a conta do app e estabelece a sessão.
  let userId: string;
  try {
    const provisioned = await provisionAppUser(identity, leadId);
    userId = provisioned.userId;

    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: provisioned.email,
      password: provisioned.password,
    });
    if (signInError) {
      console.error("[house-login] provisionou mas nao logou no app", signInError);
      return NextResponse.json({ error: "sessao_falhou" }, { status: 500 });
    }
  } catch (error) {
    console.error("[house-login] falha ao provisionar", error);
    return NextResponse.json({ error: "provisionamento_falhou" }, { status: 500 });
  }

  // Login válido na casa = tem conta lá = libera o app.
  await promoteAccessLevel(userId, "REGISTERED_USER").catch((e) => console.error("[house-login] promote", e));
  await trackServerEvent({ eventName: "HouseLoginSucceeded", userId, properties: { hasExternalId: Boolean(identity.externalId) } }).catch(() => {});

  const response = NextResponse.json({ ok: true });
  // Vida do cookie = vida do JWT da Bateu (7 dias). Antes eram 12h, e como a
  // sessão do app (Supabase) dura mais, o token da casa vencia primeiro e o
  // usuário ficava "logado" mas sem token pra depositar (sessao_casa_ausente).
  response.cookies.set(HOUSE_TOKEN_COOKIE, auth.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  // Sessão da casa (bet7k_session) — a carteira valida contra ela no depósito.
  if (auth.sessionCookie) {
    response.cookies.set(HOUSE_SESSION_COOKIE, auth.sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}
