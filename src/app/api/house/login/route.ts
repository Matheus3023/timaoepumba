import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { authenticateWithHouse } from "@/lib/odds/houseAuth";
import { HOUSE_TOKEN_COOKIE } from "@/lib/odds/houseSession";
import { promoteAccessLevel } from "@/lib/entitlements/rules";
import { trackServerEvent } from "@/lib/tracking/events";

const bodySchema = z.object({
  login: z.string().min(1).max(120),
  password: z.string().min(6).max(200),
});

/**
 * Login do usuário com a conta da casa.
 *
 * Recebe login (email ou CPF) + senha, repassa para a casa, e guarda APENAS
 * o token de sessão num cookie httpOnly. A senha nunca é gravada nem
 * devolvida — ela morre nesta função.
 *
 * Ter conta na casa é o que libera o app (o portão de acesso). Um login
 * bem-sucedido é prova de que a conta existe, então promovemos o usuário
 * aqui: fecha o ciclo sem depender do postback.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "dados_invalidos" }, { status: 400 });
  }

  const result = await authenticateWithHouse(parsed.data.login, parsed.data.password);

  await trackServerEvent({
    eventName: "HouseLoginAttempted",
    userId: user.id,
    properties: { ok: result.ok, reason: result.ok ? "ok" : result.reason },
  }).catch(() => {});

  if (!result.ok) {
    const status = result.reason === "credenciais" ? 401 : 502;
    return NextResponse.json({ error: result.reason }, { status });
  }

  // Login válido = tem conta na casa. Libera o app.
  await promoteAccessLevel(user.id, "REGISTERED_USER").catch((error) => {
    console.error("[house-login] falha ao promover", error);
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(HOUSE_TOKEN_COOKIE, result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // Sessão da casa costuma durar pouco; se expirar, o usuário reautentica.
    maxAge: 60 * 60 * 12,
  });
  return response;
}
