import { NextResponse, type NextRequest } from "next/server";
import { runFunilTick } from "@/lib/funil/tick";

/**
 * Executa um ciclo do MOTOR FUNIL: coleta as partidas ao vivo elegiveis,
 * normaliza, calcula, avalia as seis estrategias, grava sinais e snapshots,
 * notifica o que nao estiver em shadow mode e apura os sinais de jogos ja
 * encerrados.
 *
 * Feito para um agendador externo chamar a cada ~60s (n8n, no padrao de
 * /api/automations/run-inactivity) — dai o segredo compartilhado em vez de
 * sessao de usuario. Nao existe caminho pelo qual o navegador dispare isto:
 * o calculo e central, e o cliente so le o resultado (PRD sec. 55).
 *
 * curl -X POST https://.../api/funil/tick \
 *   -H "X-Automation-Secret: $AUTOMATIONS_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const secret = process.env.AUTOMATIONS_CRON_SECRET;
  const provided =
    request.headers.get("x-automation-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const summary = await runFunilTick();

  return NextResponse.json({
    ok: summary.errors.length === 0,
    durationMs: Date.now() - startedAt,
    summary,
  });
}
