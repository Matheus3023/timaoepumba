import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyAndRelease } from "@/lib/entitlements/gate";
import { trackServerEvent } from "@/lib/tracking/events";

/**
 * "Já me cadastrei, verificar" da tela de liberação.
 *
 * O caminho normal de liberação é o postback da casa. Esta rota é a segunda
 * via: existe para o usuário que JÁ se cadastrou e ficou preso porque o
 * postback não chegou ou falhou depois de gravar o evento. Sem ela, uma
 * falha do lado da casa vira usuário perdido — e com tráfego pago rodando,
 * cada um desses custa dinheiro.
 *
 * Não libera por confiança: só promove quem tem evento de afiliado gravado.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await verifyAndRelease(user.id);

  await trackServerEvent({
    eventName: "AccessGateVerifyAttempted",
    userId: user.id,
    properties: { released: result.released, reason: result.reason },
  }).catch(() => {});

  return NextResponse.json(result);
}
