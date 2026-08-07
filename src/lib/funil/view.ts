import "server-only";
/**
 * Leitura dos sinais para a interface.
 *
 * O cliente NUNCA calcula nada: ele recebe o que o motor já processou
 * (PRD sec. 55). Este módulo só junta o sinal com os dados da partida —
 * `live_strategy_signals` guarda o id da partida, e nome/escudo dos times
 * ficam em `funil_fixtures`, que é service-role.
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { compareSignalsForDisplay } from "@/lib/funil/engine";
import type { StoredMetrics } from "@/lib/funil/presentation";
import type { RuleResult, SignalState, StrategyId } from "@/lib/funil/types";
import type { FunilFixtureRow, LiveStrategySignalRow } from "@/types/database";

const PROVIDER = "flashscore4";

/**
 * Sinal sem avaliação recente deixa de ser mostrado. Se o motor parar (tick
 * caído, agendador desligado), um sinal antigo continuaria na tela como se
 * ainda estivesse valendo — que é exatamente o que a sec. 27 proíbe.
 */
export const SIGNAL_STALE_AFTER_SECONDS = 300;

const ACTIVE_STATES: SignalState[] = ["PRE_SIGNAL", "VALIDATED", "ENTRY_AVAILABLE"];

/** Forma serializável enviada aos componentes de interface. */
export interface FunilSignalView {
  id: string;
  strategyId: StrategyId;
  strategyVersion: string;
  state: SignalState;
  minute: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
  tpScore: number | null;
  tpClass: string | null;
  entryLineLabel: string | null;
  entryMarket: string | null;
  entryOdd: number | null;
  dataQuality: string | null;
  warnings: string[];
  reason: string | null;
  rules: RuleResult[];
  metrics: StoredMetrics;
  lastEvaluatedAt: string;
  competition: string;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamName: string;
  awayTeamLogo: string | null;
}

function toView(signal: LiveStrategySignalRow, fixture: FunilFixtureRow | undefined): FunilSignalView {
  return {
    id: signal.id,
    strategyId: signal.strategy_id as StrategyId,
    strategyVersion: signal.strategy_version,
    state: signal.state as SignalState,
    minute: signal.minute,
    scoreHome: signal.score_home,
    scoreAway: signal.score_away,
    tpScore: signal.tp_score,
    tpClass: signal.tp_class,
    entryLineLabel: signal.entry_line_label,
    entryMarket: signal.entry_market,
    entryOdd: signal.entry_odd === null ? null : Number(signal.entry_odd),
    dataQuality: signal.data_quality,
    warnings: (signal.warnings ?? []) as string[],
    reason: signal.reason,
    rules: (signal.rule_results ?? []) as RuleResult[],
    metrics: (signal.metrics ?? {}) as StoredMetrics,
    lastEvaluatedAt: signal.last_evaluated_at,
    competition: fixture?.league_name ?? "Competição",
    homeTeamName: fixture?.home_team_name ?? "Casa",
    homeTeamLogo: fixture?.home_team_logo ?? null,
    awayTeamName: fixture?.away_team_name ?? "Fora",
    awayTeamLogo: fixture?.away_team_logo ?? null,
  };
}

async function attachFixtures(signals: LiveStrategySignalRow[]): Promise<FunilSignalView[]> {
  if (signals.length === 0) return [];

  const admin = createAdminSupabaseClient();
  const { data: fixtures } = await admin
    .from("funil_fixtures")
    .select("*")
    .eq("provider", PROVIDER)
    .in("provider_match_id", [...new Set(signals.map((signal) => signal.provider_match_id))]);

  const byId = new Map((fixtures ?? []).map((fixture) => [fixture.provider_match_id, fixture]));
  return signals.map((signal) => toView(signal, byId.get(signal.provider_match_id)));
}

/**
 * Sinais ativos e visíveis. `shadow = false` é filtrado explicitamente aqui
 * além da policy de RLS: esta consulta usa o cliente service-role, que passa
 * por cima de RLS, então a proteção precisa estar na query também.
 */
export async function loadActiveSignals(): Promise<{ signals: FunilSignalView[]; available: boolean }> {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - SIGNAL_STALE_AFTER_SECONDS * 1000).toISOString();

  const { data, error } = await admin
    .from("live_strategy_signals")
    .select("*")
    .eq("shadow", false)
    .in("state", ACTIVE_STATES)
    .gte("last_evaluated_at", cutoff)
    .limit(60);

  if (error) {
    console.error("[funil] falha ao carregar sinais ativos", error);
    return { signals: [], available: false };
  }

  const views = await attachFixtures(data ?? []);
  return {
    signals: views.sort((a, b) =>
      compareSignalsForDisplay(
        { state: a.state, tpScore: a.tpScore, minute: a.minute },
        { state: b.state, tpScore: b.tpScore, minute: b.minute }
      )
    ),
    available: true,
  };
}

/** Um sinal específico para a tela "VER ANÁLISE". */
export async function loadSignalDetail(signalId: string): Promise<FunilSignalView | null> {
  const admin = createAdminSupabaseClient();
  const { data: signal } = await admin
    .from("live_strategy_signals")
    .select("*")
    .eq("id", signalId)
    .eq("shadow", false)
    .maybeSingle();

  if (!signal) return null;
  const [view] = await attachFixtures([signal]);
  return view ?? null;
}
