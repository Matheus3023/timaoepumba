import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchHouseEventDetails, fetchLiveHouseOdds } from "@/lib/odds/altenarClient";
import { listCornerLines } from "@/lib/odds/cornerMarket";
import { matchFixtureToOdds } from "@/lib/odds/matchOdds";
import type { FixtureKey, HouseOddsEvent } from "@/lib/odds/types";

/**
 * Sondagem do mercado da casa, para responder com dado uma pergunta que hoje
 * é palpite: a partir de que minuto a Bateu fecha o mercado de escanteios?
 *
 * Observação de campo que motivou isto: aos 68' o grupo "Escanteios" existe;
 * aos 89' não. As estratégias de canto FT disparam entre 86' e 89'. Se o
 * mercado costuma estar fechado nessa faixa, o sinal é correto e inapostável
 * — e isso é pior do que sinal errado, porque parece que está funcionando.
 *
 * Não alimenta decisão nenhuma do motor. É medição, e por isso tem chave
 * própria: dá para medir sem ligar a regra de odd (`HOUSE_ODDS_ENABLED`),
 * que mudaria quais sinais são emitidos.
 */

export function houseProbeEnabled(): boolean {
  return process.env.HOUSE_ODDS_PROBE === "true";
}

/**
 * Só sondamos a partir daqui. Antes disso o mercado está sempre aberto e a
 * amostra não ensina nada — gastaria chamada para confirmar o óbvio.
 */
const PROBE_FROM_MINUTE = 60;

let cache: { at: number; events: HouseOddsEvent[] } | null = null;
const LIVE_LIST_TTL_MS = 45_000;

async function liveEvents(): Promise<HouseOddsEvent[]> {
  if (cache && Date.now() - cache.at < LIVE_LIST_TTL_MS) return cache.events;
  const events = await fetchLiveHouseOdds();
  cache = { at: Date.now(), events };
  return events;
}

export interface ProbeTarget extends FixtureKey {
  providerMatchId: string;
  minute: number | null;
}

/**
 * Sonda as partidas informadas e grava uma linha por partida/minuto.
 *
 * Devolve quantas sondagens foram gravadas. Nunca lança: é instrumentação,
 * e instrumentação não pode derrubar o tick que ela observa.
 */
export async function probeHouseMarkets(targets: ProbeTarget[]): Promise<number> {
  if (!houseProbeEnabled()) return 0;

  // O filtro garante o minuto, mas o tipo não acompanha o `filter` — o
  // `map` seguinte fixa isso, e evita `!` espalhado adiante.
  const elegiveis = targets
    .filter((t): t is ProbeTarget & { minute: number } => t.minute !== null && t.minute >= PROBE_FROM_MINUTE)
    .map((t) => ({ ...t, minute: t.minute }));
  if (elegiveis.length === 0) return 0;

  let gravadas = 0;

  try {
    const eventos = await liveEvents();
    const admin = createAdminSupabaseClient();

    for (const target of elegiveis) {
      try {
        const casamento = matchFixtureToOdds(target, eventos);

        let temMercado = false;
        let linhas: number[] = [];
        let houseEventId: string | null = null;

        if (casamento.status === "matched") {
          houseEventId = casamento.event.providerEventId;
          const detalhe = await fetchHouseEventDetails(houseEventId).catch(() => null);
          if (detalhe) {
            linhas = listCornerLines(detalhe);
            temMercado = linhas.length > 0;
          }
        }

        // `upsert` com ignoreDuplicates: uma sondagem por partida por minuto.
        // O minuto repete entre ticks (acréscimo, atraso do provedor), e sem
        // isto as partidas de tick mais lento dominariam a amostra.
        const { error } = await admin.from("house_market_probes").upsert(
          {
            provider_match_id: target.providerMatchId,
            minute: target.minute,
            has_corner_market: temMercado,
            available_lines: linhas,
            match_status: casamento.status,
            house_event_id: houseEventId,
          },
          { onConflict: "provider_match_id,minute", ignoreDuplicates: true }
        );
        if (!error) gravadas += 1;
      } catch {
        // Uma partida que falha não pode interromper a sondagem das outras.
      }
    }
  } catch (error) {
    console.error("[odds] sondagem de mercado falhou", error);
  }

  return gravadas;
}
