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

/* ---------------------------------------------------------------------------
   HISTÓRICO DE RESULTADO

   Sem isso o produto pede confiança sem prestar contas: o usuário vê o sinal
   ao vivo e nunca descobre se deu certo. Mostrar green e red — inclusive os
   reds — é o que separa análise de palpite.
   --------------------------------------------------------------------------- */

/** Como o motor liquida um sinal (`settle.ts`). */
export type SignalResult = "GREEN" | "RED" | "PUSH" | "VOID";

export interface SettledSignalView {
  id: string;
  strategyId: StrategyId;
  result: SignalResult;
  /** Minuto em que o sinal saiu, e minuto em que resolveu. */
  signalMinute: number | null;
  resultMinute: number | null;
  resolvingEvent: string | null;
  entryLineLabel: string | null;
  entryOdd: number | null;
  scoreAtEntry: string | null;
  /** Nulo enquanto o motor gravou o desfecho mas ainda não carimbou a hora. */
  resolvedAt: string | null;
  competition: string;
  homeTeamName: string;
  awayTeamName: string;
}

export interface StrategyTally {
  strategyId: StrategyId;
  green: number;
  red: number;
  /** PUSH e VOID entram separados: não são acerto nem erro, e diluir os dois
   *  dentro de "green" inflaria o aproveitamento de graça. */
  neutral: number;
  /** green / (green + red). `null` quando ainda não houve nenhum resolvido —
   *  0% e "sem dados" são coisas diferentes e não podem virar o mesmo número. */
  hitRate: number | null;
}

export interface FunilHistory {
  settled: SettledSignalView[];
  byStrategy: StrategyTally[];
  total: { green: number; red: number; neutral: number; hitRate: number | null };
}

/**
 * Sinais já resolvidos, do mais recente para o mais antigo.
 *
 * Junta três tabelas porque cada uma guarda um pedaço: `signal_results` tem o
 * desfecho, `live_strategy_signals` tem o contexto da entrada, e
 * `funil_fixtures` tem os nomes dos times.
 */
export async function loadFunilHistory(limit = 50): Promise<FunilHistory> {
  const vazio: FunilHistory = {
    settled: [],
    byStrategy: [],
    total: { green: 0, red: 0, neutral: 0, hitRate: null },
  };

  const admin = createAdminSupabaseClient();

  const { data: results, error } = await admin
    .from("signal_results")
    .select("*")
    .order("resolved_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[funil] falha ao carregar histórico", error);
    return vazio;
  }
  if (!results || results.length === 0) return vazio;

  /* Só sinais reais entram no histórico. Sinal em shadow serve para o
     operador calibrar a estratégia, e contá-lo aqui inflaria o placar com
     entradas que ninguém chegou a ver. */
  const { data: signals } = await admin
    .from("live_strategy_signals")
    .select("*")
    .eq("shadow", false)
    .in("id", results.map((r) => r.signal_id));

  const signalById = new Map((signals ?? []).map((s) => [s.id, s]));

  const { data: fixtures } = await admin
    .from("funil_fixtures")
    .select("*")
    .eq("provider", PROVIDER)
    .in("provider_match_id", [...new Set((signals ?? []).map((s) => s.provider_match_id))]);

  const fixtureById = new Map((fixtures ?? []).map((f) => [f.provider_match_id, f]));

  const settled: SettledSignalView[] = [];
  for (const row of results) {
    const signal = signalById.get(row.signal_id);
    if (!signal) continue;
    const fixture = fixtureById.get(signal.provider_match_id);
    settled.push({
      id: row.signal_id,
      strategyId: signal.strategy_id as StrategyId,
      result: row.result as SignalResult,
      signalMinute: row.signal_minute,
      resultMinute: row.result_minute,
      resolvingEvent: row.resolving_event,
      entryLineLabel: signal.entry_line_label,
      entryOdd: row.entry_odd === null ? null : Number(row.entry_odd),
      scoreAtEntry: row.score_at_entry,
      resolvedAt: row.resolved_at,
      competition: fixture?.league_name ?? "Competição",
      homeTeamName: fixture?.home_team_name ?? "Casa",
      awayTeamName: fixture?.away_team_name ?? "Fora",
    });
  }

  const tallyOf = (linhas: SettledSignalView[]) => {
    const green = linhas.filter((s) => s.result === "GREEN").length;
    const red = linhas.filter((s) => s.result === "RED").length;
    const neutral = linhas.length - green - red;
    const decididos = green + red;
    return { green, red, neutral, hitRate: decididos === 0 ? null : green / decididos };
  };

  const estrategias = [...new Set(settled.map((s) => s.strategyId))];
  const byStrategy: StrategyTally[] = estrategias
    .map((strategyId) => ({
      strategyId,
      ...tallyOf(settled.filter((s) => s.strategyId === strategyId)),
    }))
    .sort((a, b) => b.green + b.red - (a.green + a.red));

  return { settled, byStrategy, total: tallyOf(settled) };
}
