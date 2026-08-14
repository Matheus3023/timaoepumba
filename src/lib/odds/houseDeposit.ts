import "server-only";

/**
 * Geração de depósito PIX pela conta da casa (Bateu), por dentro do app.
 *
 * Mesmo modelo do login espelho ([[houseAuth]]): o usuário está logado com a
 * conta da Bateu, e o token de sessão dela mora no cookie httpOnly
 * `tp_house_token`. Aqui repassamos esse token para o endpoint interno de
 * carteira da casa e devolvemos o PIX (QR + copia-e-cola) para o app exibir —
 * sem o usuário sair para o site da casa.
 *
 * Contrato observado no fluxo real da Bateu (request capturada no site):
 *   POST {base}/api/wallet/add-credit
 *   headers (além de Authorization: Bearer <jwt>): tenant e origin-domain =
 *     host da casa (bateu.bet.br) — identificam a casa e destravam a validação
 *     de auth; + country/country_alpha3/currency/jurisdiction/lang/language.
 *   body: { user_id (number), credit_amount (EM CENTAVOS), payment_method,
 *           currency, utm_source (ref do afiliado), ga_client_id }
 *   resp: { success, message, transaction_id, qr_code, br_code, checkout_url,
 *           payment_link, value (em centavos) }
 *
 * ATENÇÃO: `credit_amount` e `value` são em CENTAVOS — R$ 10,00 vira 1000.
 * `br_code` é o EMV copia-e-cola (começa em "0002..."); `qr_code` é a imagem
 * do QR (URL). O `user_id` sai do claim `sub` do JWT (número).
 *
 * Como é endpoint interno da casa (não contrato de parceiro), base/caminho e
 * método padrão saem de env, para trocar sem tocar em código se a casa mudar.
 * A rota que chama isto roda fixada em gru1 — a Cloudflare da casa devolve 403
 * para IP fora do BR (mesma armadilha do login).
 */

const HOUSE_BASE = process.env.HOUSE_AUTH_BASE_URL ?? "https://bateu.bet.br";
const DEPOSIT_PATH = process.env.HOUSE_DEPOSIT_PATH ?? "/api/wallet/add-credit";
const DEFAULT_METHOD = process.env.HOUSE_DEPOSIT_METHOD ?? "efibank";
// Ref do afiliado Timão e Pumba (atribuição do depósito). Ver bateubet-afiliado.
const AFFILIATE_REF = process.env.HOUSE_AFFILIATE_REF ?? "537615";
const DEFAULT_TIMEOUT_MS = 20_000;

/** Host da casa sem protocolo — vai nos headers `tenant` e `origin-domain`. */
function houseHost(): string {
  try {
    return new URL(HOUSE_BASE).host;
  } catch {
    return "bateu.bet.br";
  }
}

/** Métodos de depósito ativos na casa (payments API: deposit[].slug). */
export const HOUSE_DEPOSIT_METHODS = ["efibank", "paag", "triopay"] as const;
export type HouseDepositMethod = (typeof HOUSE_DEPOSIT_METHODS)[number];

export interface HouseDepositInput {
  /** Token de sessão da casa (cookie tp_house_token). */
  token: string;
  /** Valor em reais. Mínimo R$ 10,00. */
  value: number;
  method?: string;
  utmSource?: string | null;
  gaClientId?: string | null;
}

export type HouseDepositResult =
  | {
      ok: true;
      transactionId: string | null;
      /** EMV copia-e-cola do PIX. */
      brCode: string | null;
      /** Imagem do QR (URL http(s) ou data:image), quando a casa devolve. */
      qrCodeImage: string | null;
      checkoutUrl: string | null;
      paymentLink: string | null;
      value: number;
    }
  | {
      ok: false;
      reason: "token_invalido" | "sessao_invalida" | "valor_invalido" | "recusado" | "indisponivel";
      /** Pista diagnóstica não-sensível (status/mensagem da casa) para depurar sem log. */
      detail?: string;
    };

/**
 * Lê o claim `sub` (id do usuário na casa) do JWT sem validar assinatura —
 * só precisamos do id, e o token já foi validado pela casa quando foi emitido.
 */
function userIdFromToken(token: string): string | null {
  const claims = tokenClaims(token);
  const sub = claims?.sub;
  if (typeof sub === "string" && sub) return sub;
  if (typeof sub === "number") return String(sub);
  return null;
}

/** Decodifica o payload do JWT (sem validar assinatura) para diagnóstico. */
function tokenClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Resumo não-sensível das claims (ha/iss/sub/exp) para comparar contexto. */
function tokenSummary(token: string): string {
  const c = tokenClaims(token);
  if (!c) return "nao-jwt";
  const iss = typeof c.iss === "string" ? c.iss.replace(/^https?:\/\//, "").split("/")[0] : "?";
  const exp = typeof c.exp === "number" ? new Date(c.exp * 1000).toISOString().slice(0, 16) : "?";
  return `ha=${c.ha ?? "-"} iss=${iss} sub=${c.sub ?? "-"} exp=${exp}`;
}

export async function createHouseDeposit(input: HouseDepositInput): Promise<HouseDepositResult> {
  const value = Math.round((Number(input.value) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(value) || value < 10) {
    return { ok: false, reason: "valor_invalido" };
  }

  const userId = userIdFromToken(input.token);
  if (!userId) {
    // O token guardado no login não é um JWT decodificável (sem claim `sub`).
    const parts = input.token.split(".").length;
    console.error("[house-deposit] token sem sub reconhecível", { parts, len: input.token.length });
    return { ok: false, reason: "token_invalido", detail: `token nao-jwt (parts=${parts}, len=${input.token.length})` };
  }

  const method = HOUSE_DEPOSIT_METHODS.includes(input.method as HouseDepositMethod)
    ? (input.method as HouseDepositMethod)
    : DEFAULT_METHOD;

  const url = `${HOUSE_BASE.replace(/\/+$/, "")}${DEPOSIT_PATH}`;
  const host = houseHost();
  // Valor vai em CENTAVOS (R$ 10,00 → 1000). user_id como número.
  const amountCents = Math.round(value * 100);
  const userIdNum = Number(userId);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        // A casa autentica a carteira pelo header Authorization: Bearer. Além
        // dele, `tenant` e `origin-domain` (= host da casa) identificam a casa
        // e são o que destrava a validação ("Wrong auth validation" sem eles).
        authorization: `Bearer ${input.token}`,
        cookie: `jwt_token=${input.token}`,
        tenant: host,
        "origin-domain": host,
        // Contexto geo/locale que o site manda junto.
        country: "BR",
        country_alpha3: "BRA",
        currency: "BRL",
        jurisdiction: "BR",
        lang: "pt-br",
        language: "pt-br",
        origin: HOUSE_BASE,
        referer: `${HOUSE_BASE.replace(/\/+$/, "")}/`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        user_id: Number.isFinite(userIdNum) ? userIdNum : userId,
        credit_amount: amountCents,
        payment_method: method,
        currency: "BRL",
        utm_source: input.utmSource || AFFILIATE_REF,
        ga_client_id: input.gaClientId ?? "",
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[house-deposit] falha de rede", error);
    return { ok: false, reason: "indisponivel" };
  }

  // Lê o corpo uma vez; serve tanto para sucesso quanto para diagnóstico.
  const bodyText = await response.text().catch(() => "");
  const data = (() => {
    try {
      return JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  // Mensagem curta e não-sensível da casa, para depurar sem log de servidor.
  const houseMsg = (typeof data?.status === "string" && data.status) || (typeof data?.message === "string" && data.message) || "";

  if (response.status === 401 || response.status === 403) {
    // 401 = token recusado pela casa (contexto/assinatura errados, ex.: "Wrong
    // auth validation" ou "Token not provided"); 403 = geobloqueio (função
    // rodou fora do BR — checar região gru1).
    console.error(`[house-deposit] casa negou auth ${response.status}: ${houseMsg}`);
    return {
      ok: false,
      reason: "sessao_invalida",
      // Inclui o resumo do NOSSO token para comparar contexto com o da casa.
      detail: `casa HTTP ${response.status}${houseMsg ? `: ${houseMsg}` : ""} | token[${tokenSummary(input.token)}]`,
    };
  }
  if (!response.ok) {
    console.error(`[house-deposit] HTTP inesperado ${response.status}: ${houseMsg}`);
    return { ok: false, reason: "indisponivel", detail: `casa HTTP ${response.status}${houseMsg ? `: ${houseMsg}` : ""}` };
  }

  if (!data || data.success === false) {
    console.error("[house-deposit] casa recusou", houseMsg || (data ? Object.keys(data) : null));
    return { ok: false, reason: "recusado", detail: houseMsg || "casa recusou o depósito" };
  }

  const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
  const brCode = str(data.br_code) ?? str(data.qr_code_emv) ?? str(data.pix_code);
  // qr_code costuma ser a imagem; se vier igual ao br_code (EMV), não é imagem.
  const qrRaw = str(data.qr_code_image) ?? str(data.qr_code);
  const qrCodeImage = qrRaw && qrRaw !== brCode ? qrRaw : null;

  return {
    ok: true,
    transactionId: str(data.transaction_id) ?? str(data.id),
    brCode,
    qrCodeImage,
    checkoutUrl: str(data.checkout_url),
    paymentLink: str(data.payment_link),
    // Sempre devolvemos em REAIS (o que o usuário pediu). data.value vem em
    // centavos; não usamos para não mostrar R$ 1000 num depósito de R$ 10.
    value,
  };
}
