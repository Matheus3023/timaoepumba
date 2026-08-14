import "server-only";

/**
 * Autenticação do usuário contra a casa (Bateu).
 *
 * O usuário entra com a MESMA conta da Bateu — o endpoint de login do site
 * (`/api/auth/login`) valida email/CPF + senha e devolve um token de sessão.
 * Esse token alimenta o widget da Altenar via `setAccessToken`, e o app fica
 * logado com a conta real do usuário na casa. Uma conta só.
 *
 * A senha NUNCA é guardada. Chega aqui, é repassada para a casa, e o que
 * fica é só o token. A rota que chama isto roda no servidor (nunca no
 * browser), então a senha não trafega para lugar nenhum além da casa.
 *
 * Endpoint interno da casa, não um contrato de parceiro documentado: por
 * isso base e caminho saem de env, para trocar sem tocar em código se a casa
 * mudar. Se ela bloquear por origem ou mudar o formato, a UI cai no caminho
 * de erro e o usuário usa o link de abrir na casa.
 */

const AUTH_BASE = process.env.HOUSE_AUTH_BASE_URL ?? "https://bateu.bet.br";
const AUTH_PATH = process.env.HOUSE_AUTH_PATH ?? "/api/auth/login";
const DEFAULT_TIMEOUT_MS = 12_000;

export type HouseAuthResult =
  | {
      ok: true;
      token: string;
      /** Cookie de sessão (bet7k_session) que o login seta; a carteira valida
       *  contra ele. Guardamos e reenviamos junto do Bearer no depósito. */
      sessionCookie: string | null;
      raw: Record<string, unknown> | null;
    }
  | { ok: false; reason: "credenciais" | "indisponivel" | "sem_token" };

/**
 * O login pode chegar como email ou CPF — o próprio site aceita os dois no
 * mesmo campo `login`. Não normalizamos: repassamos como o usuário digitou.
 */
export async function authenticateWithHouse(
  login: string,
  password: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<HouseAuthResult> {
  const url = `${AUTH_BASE.replace(/\/+$/, "")}${AUTH_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Cara de navegador de verdade: a Cloudflare da casa recusa requisição
        // "de robô". UA + Origin/Referer do próprio site + accept-language BR.
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
        origin: AUTH_BASE,
        referer: `${AUTH_BASE.replace(/\/+$/, "")}/`,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ login, password }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[house-auth] falha de rede", error);
    return { ok: false, reason: "indisponivel" };
  }

  // 422 é o que a casa devolve tanto para "campo faltando" quanto para
  // "credencial errada" — para o usuário, os dois são "login incorreto".
  if (response.status === 401 || response.status === 422) {
    return { ok: false, reason: "credenciais" };
  }
  if (!response.ok) {
    console.error(`[house-auth] HTTP inesperado ${response.status}`);
    return { ok: false, reason: "indisponivel" };
  }

  // A casa entrega o token da carteira no cookie `jwt_token` (Set-Cookie), não
  // (só) no corpo. É esse valor que o site usa como Bearer; o token do corpo é
  // rejeitado pela carteira ("Wrong auth validation"). Preferimos o do cookie.
  const setCookies = readSetCookies(response);
  const cookieToken = cookieValue(setCookies, "jwt_token");
  const sessionCookie = cookieValue(setCookies, "bet7k_session");

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const token = cookieToken ?? extractToken(data);
  if (!token) {
    // Autenticou mas não achamos o token no formato esperado — tratamos como
    // indisponível em vez de "credencial", para não culpar o usuário por um
    // descasamento nosso com o formato da casa.
    console.error("[house-auth] resposta sem token reconhecível", {
      setCookieNames: setCookies.map((c) => c.split("=")[0]),
      bodyKeys: data ? Object.keys(data) : null,
    });
    return { ok: false, reason: "sem_token" };
  }
  console.log(`[house-auth] token via ${cookieToken ? "cookie jwt_token" : "corpo"}; sessao=${sessionCookie ? "sim" : "nao"}`);
  return { ok: true, token, sessionCookie, raw: data };
}

/** Lê os headers Set-Cookie da resposta (undici expõe getSetCookie). */
function readSetCookies(response: Response): string[] {
  const h = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

/** Extrai o valor de um cookie pelo nome, a partir dos Set-Cookie. */
function cookieValue(setCookies: string[], name: string): string | null {
  for (const c of setCookies) {
    const m = c.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

/**
 * O token pode vir em nomes diferentes conforme a versão da API. Procuramos
 * os candidatos conhecidos em vez de fixar um, para o primeiro login real
 * não quebrar por um nome de campo.
 */
function extractToken(data: Record<string, unknown> | null): string | null {
  if (!data) return null;

  const candidatosDiretos = ["token", "access_token", "accessToken", "jwt", "auth_token"];
  for (const chave of candidatosDiretos) {
    const valor = data[chave];
    if (typeof valor === "string" && valor.length > 0) return valor;
  }

  // Alguns backends aninham em { data: { token } } ou { auth: { token } }.
  for (const wrapper of ["data", "auth", "result", "user"]) {
    const bloco = data[wrapper];
    if (bloco && typeof bloco === "object") {
      const aninhado = extractToken(bloco as Record<string, unknown>);
      if (aninhado) return aninhado;
    }
  }
  return null;
}
