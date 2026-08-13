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
 * Contrato observado no fluxo real da Bateu:
 *   POST {base}/api/wallet/add-credit
 *   body: { user_id, credit_amount, payment_method, currency, utm_source, ga_client_id }
 *   resp: { success, message, transaction_id, qr_code, br_code, checkout_url, payment_link, value }
 *
 * `br_code` é o EMV copia-e-cola (começa em "0002..."); `qr_code` é a imagem
 * do QR (URL http(s) ou data:image). O `user_id` sai do claim `sub` do JWT.
 *
 * Como é endpoint interno da casa (não contrato de parceiro), base/caminho e
 * método padrão saem de env, para trocar sem tocar em código se a casa mudar.
 * A rota que chama isto roda fixada em gru1 — a Cloudflare da casa devolve 403
 * para IP fora do BR (mesma armadilha do login).
 */

const HOUSE_BASE = process.env.HOUSE_AUTH_BASE_URL ?? "https://bateu.bet.br";
const DEPOSIT_PATH = process.env.HOUSE_DEPOSIT_PATH ?? "/api/wallet/add-credit";
const DEFAULT_METHOD = process.env.HOUSE_DEPOSIT_METHOD ?? "efibank";
const DEFAULT_TIMEOUT_MS = 20_000;

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
  | { ok: false; reason: "sessao_invalida" | "valor_invalido" | "recusado" | "indisponivel" };

/**
 * Lê o claim `sub` (id do usuário na casa) do JWT sem validar assinatura —
 * só precisamos do id, e o token já foi validado pela casa quando foi emitido.
 */
function userIdFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
    const sub = payload.sub;
    if (typeof sub === "string" && sub) return sub;
    if (typeof sub === "number") return String(sub);
    return null;
  } catch {
    return null;
  }
}

export async function createHouseDeposit(input: HouseDepositInput): Promise<HouseDepositResult> {
  const value = Math.round((Number(input.value) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(value) || value < 10) {
    return { ok: false, reason: "valor_invalido" };
  }

  const userId = userIdFromToken(input.token);
  if (!userId) {
    console.error("[house-deposit] token sem sub reconhecível");
    return { ok: false, reason: "sessao_invalida" };
  }

  const method = HOUSE_DEPOSIT_METHODS.includes(input.method as HouseDepositMethod)
    ? (input.method as HouseDepositMethod)
    : DEFAULT_METHOD;

  const url = `${HOUSE_BASE.replace(/\/+$/, "")}${DEPOSIT_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
        // A casa autentica a carteira pelo cookie jwt_token; mandamos também
        // Authorization por garantia (o site envia os dois conforme a versão).
        cookie: `jwt_token=${input.token}`,
        authorization: `Bearer ${input.token}`,
        origin: HOUSE_BASE,
        referer: `${HOUSE_BASE.replace(/\/+$/, "")}/`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        user_id: userId,
        credit_amount: value,
        payment_method: method,
        currency: "BRL",
        utm_source: input.utmSource ?? "",
        ga_client_id: input.gaClientId ?? "",
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[house-deposit] falha de rede", error);
    return { ok: false, reason: "indisponivel" };
  }

  if (response.status === 401 || response.status === 403) {
    // Sessão da casa expirou (ou a função rodou fora do BR — checar região).
    return { ok: false, reason: "sessao_invalida" };
  }
  if (!response.ok) {
    console.error(`[house-deposit] HTTP inesperado ${response.status}`);
    return { ok: false, reason: "indisponivel" };
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || data.success === false) {
    console.error("[house-deposit] casa recusou", data ? Object.keys(data) : null);
    return { ok: false, reason: "recusado" };
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
    value: typeof data.value === "number" ? data.value : value,
  };
}
