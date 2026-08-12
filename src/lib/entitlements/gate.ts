import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { promoteAccessLevel } from "@/lib/entitlements/rules";
import { REQUIRED_LEVEL, accessLevelSatisfies } from "@/lib/entitlements/levels";

export { REQUIRED_LEVEL, accessGateEnabled, needsRegistration } from "@/lib/entitlements/levels";

export interface VerifyResult {
  released: boolean;
  /** Como foi liberado (ou por que não). Vai para log e para a tela. */
  reason:
    | "ja_liberado"
    | "promovido_por_evento"
    | "sem_cadastro_encontrado"
    | "sem_lead_id"
    | "erro";
}

/**
 * Segunda via de liberação, para quando o postback não chegou.
 *
 * O caminho normal é a casa chamar /api/webhooks/affiliate, que promove o
 * usuário na hora. Esta função existe para o caso em que isso falha e o
 * usuário — que JÁ se cadastrou — está preso na tela de liberação: ela
 * reconfere direto no banco se existe evento de registro para o lead dele e
 * promove.
 *
 * Não inventa liberação: só promove se houver evento de afiliado gravado.
 * Um `affiliate_events` com o lead_id é prova de que a casa confirmou o
 * cadastro; sem ele, o usuário continua barrado.
 */
export async function verifyAndRelease(userId: string): Promise<VerifyResult> {
  try {
    const admin = createAdminSupabaseClient();

    const { data: user } = await admin
      .from("users")
      .select("id, lead_id, access_level")
      .eq("id", userId)
      .maybeSingle();

    if (!user) return { released: false, reason: "erro" };
    if (accessLevelSatisfies(user.access_level, REQUIRED_LEVEL)) {
      return { released: true, reason: "ja_liberado" };
    }
    if (!user.lead_id) return { released: false, reason: "sem_lead_id" };

    // O postback grava em affiliate_events antes de tentar promover. Se o
    // evento existe mas o nível não subiu, houve falha depois da gravação —
    // e é exatamente esse buraco que esta função fecha.
    const { data: event } = await admin
      .from("affiliate_events")
      .select("id, event_type")
      .eq("lead_id", user.lead_id)
      .in("event_type", ["registration", "ftd"])
      .limit(1)
      .maybeSingle();

    if (!event) return { released: false, reason: "sem_cadastro_encontrado" };

    await promoteAccessLevel(userId, event.event_type === "ftd" ? "FTD_USER" : REQUIRED_LEVEL);
    return { released: true, reason: "promovido_por_evento" };
  } catch (error) {
    console.error("[gate] verifyAndRelease falhou", error);
    return { released: false, reason: "erro" };
  }
}
