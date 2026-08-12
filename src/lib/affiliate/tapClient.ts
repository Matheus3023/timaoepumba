import "server-only";

/**
 * Cliente da API do programa de afiliados (TAP / Smartico).
 *
 * Serve a terceira via de liberação do portão de acesso: quando o postback
 * não chegou e não há evento gravado no nosso banco, perguntamos direto à
 * casa se aquele `afp` registrou. É a única fonte que não depende de nada
 * ter dado certo do lado de cá.
 *
 * ATENÇÃO AO HOST: é `boapi3.smartico.ai`, com o **3**. O `boapi.smartico.ai`
 * que aparece na documentação responde `{"errCode":3,"message":"Access to
 * this label is not allowed"}` para esta conta — foi o que manteve a
 * integração do `smartico-proxy` sem nunca funcionar. O host correto está
 * escrito no próprio painel, em Configurações de Conta.
 */

import { summarizeAfp, type AfpReportRow, type AfpSummary } from "@/lib/affiliate/afpReport";

export type { AfpSummary };

const DEFAULT_BASE_URL = "https://boapi3.smartico.ai";
const DEFAULT_TIMEOUT_MS = 8000;

export function tapConfigured(): boolean {
  return Boolean(process.env.TAP_AFFILIATE_API_KEY);
}

/**
 * Totais acumulados da casa para um `afp` (que, no nosso caso, é o Lead ID).
 *
 * Sem `aggregation_period` a API devolve o acumulado de sempre, que é o que
 * interessa aqui — não importa em que dia a pessoa se cadastrou, só se
 * cadastrou.
 *
 * Devolve `null` quando não dá para responder (sem chave, erro de rede,
 * resposta inesperada). `null` é diferente de "não achei": quem chama não
 * pode tratar indisponibilidade da casa como ausência de cadastro.
 */
export async function fetchAfpSummary(afp: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<AfpSummary | null> {
  const apiKey = process.env.TAP_AFFILIATE_API_KEY;
  if (!apiKey) return null;

  // `afp` vazio é a linha do tráfego que nunca mandou o parâmetro — ela
  // agrega TODOS os registros históricos da conta. Casar com ela liberaria
  // qualquer um, então nem chegamos a consultar.
  const alvo = afp.trim();
  if (!alvo) return null;

  const baseUrl = process.env.TAP_API_BASE_URL ?? DEFAULT_BASE_URL;
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/api/af2_media_report_af`);
  url.searchParams.set("group_by", "afp");

  try {
    const response = await fetch(url.toString(), {
      headers: { authorization: apiKey },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[tap] relatorio devolveu HTTP ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as { data?: AfpReportRow[] };
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return summarizeAfp(rows, alvo);
  } catch (error) {
    console.error("[tap] falha ao consultar relatorio por afp", error);
    return null;
  }
}
