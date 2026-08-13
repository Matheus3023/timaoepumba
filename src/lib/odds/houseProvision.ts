import "server-only";
import { createHmac } from "node:crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { syncCommunityMembership } from "@/lib/entitlements/rules";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

/**
 * Provisiona a conta do app a partir do login na casa.
 *
 * Não existe mais cadastro no app: quem manda é a conta da Bateu. Quando o
 * usuário loga com ela e nunca esteve aqui, criamos a estrutura do app
 * (auth.users + users + perfil) na hora, a partir do que a casa devolveu.
 *
 * A senha do app é DERIVADA de um segredo do servidor + a identidade da casa
 * (`HouseIdentity.externalId`, com o email como reserva). Assim:
 *  - o usuário nunca tem uma senha do app para gerenciar (a senha real é a da
 *    casa, que a gente nem guarda);
 *  - o servidor recria a mesma senha em todo login, então consegue
 *    autenticar o usuário no Supabase e estabelecer a sessão;
 *  - ninguém de fora deriva a senha sem o segredo.
 */

export interface HouseIdentity {
  email: string;
  /** Id do usuário na casa. Estável, é a chave preferida para derivar a senha. */
  externalId: string | null;
  leadId: string | null;
  fullName: string | null;
  phone: string | null;
}

/**
 * Extrai a identidade da resposta de login da casa, tolerante ao formato.
 *
 * O primeiro login real revela os nomes exatos; até lá cobrimos os
 * candidatos comuns (email, id/user_id, direto ou aninhado em data/user).
 * `fallbackLogin` é o que o usuário digitou — se for email, serve de reserva.
 */
export function extractHouseIdentity(
  data: Record<string, unknown> | null,
  fallbackLogin: string
): HouseIdentity | null {
  const buscar = (obj: Record<string, unknown> | null, chaves: string[]): string | null => {
    if (!obj) return null;
    for (const chave of chaves) {
      const v = obj[chave];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    for (const wrapper of ["data", "user", "result", "profile", "player"]) {
      const bloco = obj[wrapper];
      if (bloco && typeof bloco === "object") {
        const achou = buscar(bloco as Record<string, unknown>, chaves);
        if (achou) return achou;
      }
    }
    return null;
  };

  const emailDaResposta = buscar(data, ["email", "e_mail", "userEmail", "user_email"]);
  const loginEhEmail = /.+@.+\..+/.test(fallbackLogin);
  const email = emailDaResposta ?? (loginEhEmail ? fallbackLogin.toLowerCase() : null);

  // Sem email não dá para provisionar (Supabase exige email). Nesse caso o
  // login funciona no widget mas o app não abre; a UI trata como indisponível.
  if (!email) return null;

  return {
    email: email.toLowerCase(),
    externalId: buscar(data, ["id", "user_id", "userId", "player_id", "playerId", "customer_id"]),
    leadId: null,
    fullName: buscar(data, ["name", "full_name", "fullName", "first_name"]),
    phone: buscar(data, ["phone", "telefone", "mobile", "cellphone"]),
  };
}

/** Senha do app derivada — determinística, nunca exibida, só o servidor recria. */
function derivedPassword(identity: HouseIdentity): string {
  const secret = process.env.HOUSE_APP_PASSWORD_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const chave = identity.externalId ?? identity.email;
  return createHmac("sha256", secret).update(`house:${chave}`).digest("hex");
}

export interface ProvisionResult {
  userId: string;
  email: string;
  password: string;
  criado: boolean;
}

/**
 * Cria (ou encontra) o usuário do app para esta identidade da casa e devolve
 * a senha derivada, para quem chamou estabelecer a sessão via signInWithPassword.
 *
 * Idempotente: no segundo login o usuário já existe e só devolvemos a senha.
 */
export async function provisionAppUser(identity: HouseIdentity, leadId: string | null): Promise<ProvisionResult> {
  const admin = createAdminSupabaseClient();
  const password = derivedPassword(identity);

  // Já existe conta do app com esse email?
  const { data: existente } = await admin.from("users").select("id").eq("email", identity.email).maybeSingle();
  if (existente) {
    // Garante que a senha derivada bate com a que está no auth (caso o
    // segredo tenha mudado, ressincroniza). Não falha o login se der erro.
    await admin.auth.admin.updateUserById(existente.id, { password }).catch(() => {});
    return { userId: existente.id, email: identity.email, password, criado: false };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: identity.email,
    password,
    email_confirm: true,
    user_metadata: { source: "house_login", external_id: identity.externalId ?? undefined },
  });
  if (error || !created.user) {
    throw new Error(`nao foi possivel criar o usuario do app: ${error?.message ?? "sem user"}`);
  }

  const userId = created.user.id;
  const now = new Date().toISOString();

  await admin.from("users").insert({
    id: userId,
    lead_id: leadId ?? undefined,
    email: identity.email,
    phone: identity.phone ?? undefined,
    full_name: identity.fullName ?? undefined,
    age_confirmed: true,
    access_level: "APP_USER",
    status: "active",
    terms_accepted_version: TERMS_VERSION,
    terms_accepted_at: now,
    privacy_accepted_version: PRIVACY_VERSION,
    privacy_accepted_at: now,
  });

  await Promise.all([
    admin.from("user_profiles").insert({ user_id: userId }),
    admin.from("user_preferences").insert({ user_id: userId }),
    syncCommunityMembership(userId, "APP_USER"),
  ]);

  return { userId, email: identity.email, password, criado: true };
}
