import "server-only";
/**
 * Orquestração de um tick do motor Funil.
 *
 * Ordem fixa, que é a da sec. 42 do PRD:
 *   coleta → normalização → snapshot → motor → persistência → notificação
 *
 * Roda no servidor, uma vez por intervalo, para TODAS as partidas de uma
 * vez. Nenhum cliente dispara cálculo: 100 usuários abrindo o app não geram
 * 100 avaliações, eles leem o resultado já processado (PRD sec. 55).
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/fcm";
import { evaluateContactEligibility } from "@/lib/communication/eligibility";
import { collectLiveSnapshots, purgeOldObservations, recordTodayFixtures } from "@/lib/funil/collector";
import { decideTransition, type NotificationKind, type PersistedSignalState } from "@/lib/funil/engine";
import { DEFAULT_STRATEGY_CONFIGS, STRATEGY_LABEL } from "@/lib/funil/defaults";
import { FUNIL_LOG_CODES } from "@/lib/funil/logCodes";
import { normalizeLiveStats } from "@/lib/funil/normalize";
import { settleSignal } from "@/lib/funil/settle";
import { getSportsDataProvider } from "@/lib/sports";
import { houseProbeEnabled, probeHouseMarkets } from "@/lib/odds/probe";
import { evaluateStrategyById } from "@/lib/funil/strategies";
import type { FixtureSnapshot, StrategyConfig, StrategyEvaluation, StrategyId, StrategyParams } from "@/lib/funil/types";
import type { LiveStrategySignalRow } from "@/types/database";

const PROVIDER = "flashscore4";

/** Depois de sumir da lista ao vivo por este tempo, a partida acabou. */
const FIXTURE_FINISHED_AFTER_MINUTES = 10;

/**
 * Minuto mínimo que a última observação precisa ter para um mercado de tempo
 * integral ser apurado com confiança. Abaixo disso, o jogo parou de atualizar
 * antes do fim (dado congelado/abandono) e o total de escanteios/gols é
 * parcial — o sinal FT vira VOID em vez de RED injusto.
 */
const FT_SETTLE_MIN_MINUTE = 88;

/** Teto de destinatários por notificação, para um tick não virar um envio massivo. */
const MAX_PUSH_RECIPIENTS = 500;

/** Chave em `system_settings` onde o último tick deixa seu diagnóstico. */
export const FUNIL_DIAGNOSTICS_KEY = "funil_last_tick";

export interface FunilDiagnostics {
  at: string;
  fixturesEvaluated: number;
  /** Rótulos que o provedor mandou e o dicionário não reconheceu. */
  unmappedLabels: string[];
  /** Por competição: quais campos normalizados ficaram sem valor. */
  competitions: { competition: string; fixture: string; missingFields: string[] }[];
  errors: string[];
}

export interface TickSummary {
  fixturesRecorded: number;
  fixturesEvaluated: number;
  evaluations: number;
  signalsChanged: number;
  notificationsSent: number;
  settled: number;
  /** Sondagens do mercado da casa gravadas (instrumentacao, ver odds/probe.ts). */
  probes: number;
  unmappedLabels: string[];
  errors: string[];
}

/**
 * Carrega a versão corrente de cada estratégia.
 *
 * Se a tabela não existir (migration 0010 pendente) o tick ABORTA em vez de
 * cair nos defaults: sem banco não há onde gravar sinal nenhum, então rodar
 * o motor seria queimar cota de API para jogar o resultado fora. Diferente
 * do caso das competições, onde degradar mantinha o app de pé.
 */
export async function loadStrategyConfigs(): Promise<StrategyConfig[] | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("strategy_configs").select("*").eq("is_current", true);

  if (error) {
    console.error("[funil] nao foi possivel ler strategy_configs", error);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn("[funil] strategy_configs vazia — usando os defaults do codigo");
    return DEFAULT_STRATEGY_CONFIGS;
  }

  return data.map((row) => ({
    strategyId: row.strategy_id as StrategyId,
    version: row.version,
    enabled: row.enabled,
    shadowMode: row.shadow_mode,
    notificationEnabled: row.notification_enabled,
    preSignalEnabled: row.pre_signal_enabled,
    cooldownSeconds: row.cooldown_seconds,
    params: (row.params ?? {}) as unknown as StrategyParams,
  }));
}

/** Fotografia completa do momento do sinal (PRD sec. 35). */
function buildSnapshotPayload(snapshot: FixtureSnapshot, evaluation: StrategyEvaluation) {
  const { metrics } = evaluation;
  return {
    fixture: snapshot.fixture,
    strategy: evaluation.strategyId,
    strategy_version: evaluation.strategyVersion,
    state: evaluation.state,
    period: snapshot.period,
    minute: snapshot.liveMinute,
    injury_time: snapshot.injuryTime,
    score: { home: snapshot.scoreHome, away: snapshot.scoreAway },
    appm_home: metrics.appmHome,
    appm_away: metrics.appmAway,
    dominant_team: metrics.dominantTeam,
    dominant_appm: metrics.dominantAppm,
    cg_home: metrics.cgHome,
    cg_away: metrics.cgAway,
    cg_total: metrics.cgTotal,
    cg_adjusted: metrics.cgAdjusted,
    sequential_corner_count: metrics.sequentialCornerCount,
    possession: { home: snapshot.stats.possession_home, away: snapshot.stats.possession_away },
    shots: {
      on_target_home: snapshot.stats.shots_on_target_home,
      on_target_away: snapshot.stats.shots_on_target_away,
      off_target_home: snapshot.stats.shots_off_target_home,
      off_target_away: snapshot.stats.shots_off_target_away,
    },
    corners: { home: snapshot.stats.corners_home, away: snapshot.stats.corners_away, total: metrics.cornersTotal },
    last_corner: snapshot.lastCorner,
    red_card_context: metrics.redCardContext,
    bo: metrics.bo,
    rm: metrics.rm,
    market: snapshot.market,
    entry_line: evaluation.entryLine,
    tp_score: evaluation.tpScore,
    rule_results: evaluation.rules,
    momentum: snapshot.momentum,
    data_quality: evaluation.dataQuality,
    timestamp: snapshot.collectedAt,
  };
}

function pushContent(
  kind: NotificationKind,
  snapshot: FixtureSnapshot,
  evaluation: StrategyEvaluation
): { title: string; body: string } {
  const label = STRATEGY_LABEL[evaluation.strategyId];
  const teams = `${snapshot.fixture.homeTeamName} x ${snapshot.fixture.awayTeamName}`;
  const minute = snapshot.liveMinute !== null ? `${snapshot.liveMinute}'` : "ao vivo";

  const chips = evaluation.rules
    .filter((rule) => rule.status === "pass" && rule.key !== "window" && typeof rule.value === "number")
    .slice(0, 3)
    .map((rule) => `${rule.label} ${(rule.value as number).toFixed(2).replace(/\.00$/, "")}`)
    .join(" | ");

  if (kind === "pre_signal") {
    return {
      title: "🔥 Timão e Pumba encontrou pressão",
      body: `${label} entrando no radar. ${teams}, ${minute}. ${chips}`.trim(),
    };
  }
  if (kind === "validated") {
    return {
      title: `🚨 ${label} VALIDADO`,
      body: `${teams}, ${minute}. ${chips}. Abra o Timão e Pumba para ver a análise.`,
    };
  }
  return {
    title: `🚨 ${label} — ENTRADA ANALISADA`,
    body: `${teams}, ${minute}. ${evaluation.entryLine?.label ?? ""} ${chips}`.trim(),
  };
}

/**
 * Envia o alerta para quem tem push ativo e está elegível.
 *
 * Passa pelo mesmo filtro de elegibilidade do resto do app ("content"), que
 * respeita horário de silêncio, usuário restrito e teto diário — um sinal de
 * funil não é motivo para acordar ninguém às 3 da manhã.
 */
async function notifySignal(
  signalId: string,
  strategyId: StrategyId,
  kind: NotificationKind,
  content: { title: string; body: string }
): Promise<{ recipients: number; sent: number; failed: number }> {
  const admin = createAdminSupabaseClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .eq("status", "active")
    .limit(MAX_PUSH_RECIPIENTS);

  const userIds = [...new Set((subscriptions ?? []).map((row) => row.user_id))];
  if (userIds.length === 0) return { recipients: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const userId of userIds) {
    const eligibility = await evaluateContactEligibility(userId, "content");
    if (!eligibility.eligible) continue;

    const result = await sendPushToUser(userId, { ...content, link: `/analises/funil/${signalId}` });
    sent += result.sent;
    failed += result.failed;
  }

  await admin.from("funil_notification_logs").insert({
    signal_id: signalId,
    strategy_id: strategyId,
    kind,
    status: failed > 0 && sent === 0 ? "failed" : "sent",
    recipients: userIds.length,
    sent,
    failed,
  });

  return { recipients: userIds.length, sent, failed };
}

async function persistEvaluation(
  snapshot: FixtureSnapshot,
  evaluation: StrategyEvaluation,
  config: StrategyConfig,
  existing: LiveStrategySignalRow | undefined,
  now: Date
): Promise<{ changed: boolean; notified: number }> {
  const admin = createAdminSupabaseClient();

  const previous: PersistedSignalState | null = existing
    ? {
        state: existing.state as PersistedSignalState["state"],
        stateChangedAt: existing.state_changed_at,
        lastNotifiedState: existing.last_notified_state as PersistedSignalState["state"] | null,
        lastNotifiedAt: existing.last_notified_at,
      }
    : null;

  const decision = decideTransition({ evaluation, config, existing: previous, now });
  const nowIso = now.toISOString();
  const becameEntry = decision.nextState === "VALIDATED" || decision.nextState === "ENTRY_AVAILABLE";

  const { data: saved, error } = await admin
    .from("live_strategy_signals")
    .upsert(
      {
        provider_match_id: snapshot.fixture.fixtureId,
        strategy_id: evaluation.strategyId,
        strategy_version: evaluation.strategyVersion,
        period: snapshot.period,
        state: decision.nextState,
        shadow: config.shadowMode,
        minute: snapshot.liveMinute,
        score_home: snapshot.scoreHome,
        score_away: snapshot.scoreAway,
        rule_results: evaluation.rules,
        // O momentum entra junto das métricas de propósito: o card precisa
        // dele para o chip de pressão recente, e uma coluna separada só
        // para isso obrigaria a tela a fazer um segundo join.
        metrics: { ...evaluation.metrics, momentum: snapshot.momentum } as unknown as Record<string, unknown>,
        warnings: evaluation.warnings,
        data_quality: evaluation.dataQuality.quality,
        tp_score: evaluation.tpScore?.score ?? null,
        tp_class: evaluation.tpScore?.classification ?? null,
        reason: evaluation.reason,
        entry_odd: snapshot.market?.currentOdd ?? null,
        // A linha sugerida acompanha o jogo ENQUANTO o sinal ainda não virou
        // entrada. Depois de entrar, congela junto do resto.
        //
        // Ela ficava fora do congelamento, e era justamente contra ela que a
        // apuração resolvia: um sinal que entrou aos 83' na linha 8.0 era
        // apurado aos 90' contra a linha 14.0, que só existia porque os
        // escanteios continuaram subindo. Isso virava GREEN em RED de forma
        // sistemática — os quatro primeiros resultados do motor eram todos
        // acertos registrados como erro.
        ...(existing?.entered_at
          ? {}
          : {
              entry_market: evaluation.entryLine?.market ?? null,
              entry_line: evaluation.entryLine?.line ?? null,
              entry_line_label: evaluation.entryLine?.label ?? null,
            }),
        // Congelados na PRIMEIRA vez que o sinal virou entrada: é contra
        // estes números que o resultado será apurado depois, e eles não
        // podem ser reescritos pelos ticks seguintes.
        ...(becameEntry && !existing?.entered_at
          ? {
              entered_at: nowIso,
              goals_at_entry:
                snapshot.scoreHome === null || snapshot.scoreAway === null
                  ? null
                  : snapshot.scoreHome + snapshot.scoreAway,
              corners_at_entry: evaluation.metrics.cornersTotal,
            }
          : {}),
        ...(decision.changed ? { state_changed_at: nowIso } : {}),
        last_evaluated_at: nowIso,
      },
      { onConflict: "provider_match_id,strategy_id,strategy_version,period" }
    )
    .select("id, entered_at")
    .single();

  if (error || !saved) {
    console.error("[funil] falha ao gravar sinal", error);
    return { changed: false, notified: 0 };
  }

  // Snapshot só quando o estado muda — um por tick encheria a tabela sem
  // acrescentar informação (PRD sec. 35 pede a foto do momento do sinal).
  if (decision.changed) {
    await admin.from("signal_snapshots").insert({
      signal_id: saved.id,
      provider_match_id: snapshot.fixture.fixtureId,
      state: decision.nextState,
      minute: snapshot.liveMinute,
      payload: buildSnapshotPayload(snapshot, evaluation),
    });
  }

  // Abre o resultado como PENDING assim que vira entrada, para o sinal já
  // nascer na fila de apuração.
  if (becameEntry && !existing?.entered_at) {
    await admin.from("signal_results").upsert(
      {
        signal_id: saved.id,
        result: "PENDING",
        signal_created_at: nowIso,
        signal_minute: snapshot.liveMinute,
        entry_line: evaluation.entryLine?.line ?? null,
        entry_odd: snapshot.market?.currentOdd ?? null,
        score_at_entry: `${snapshot.scoreHome ?? "?"}x${snapshot.scoreAway ?? "?"}`,
      },
      { onConflict: "signal_id" }
    );
  }

  if (!decision.shouldNotify || !decision.notificationKind) {
    if (decision.changed && decision.suppressedReason) {
      await admin.from("funil_notification_logs").insert({
        signal_id: saved.id,
        strategy_id: evaluation.strategyId,
        kind: decision.notificationKind ?? "validated",
        status: "suppressed",
        suppressed_reason: decision.suppressedReason,
      });
    }
    return { changed: decision.changed, notified: 0 };
  }

  const content = pushContent(decision.notificationKind, snapshot, evaluation);
  const result = await notifySignal(saved.id, evaluation.strategyId, decision.notificationKind, content);

  await admin
    .from("live_strategy_signals")
    .update({ last_notified_state: decision.nextState, last_notified_at: nowIso })
    .eq("id", saved.id);

  return { changed: decision.changed, notified: result.sent };
}

/**
 * Apura os sinais de partidas que já acabaram (PRD sec. 34).
 *
 * Os números finais saem da ÚLTIMA observação gravada, não de uma nova
 * chamada à API: a partida encerrada some da lista ao vivo, e buscá-la de
 * novo custaria requisição para obter o que já temos.
 */
/**
 * Placar e escanteios definitivos de uma partida encerrada, direto do
 * provedor. Uma chamada por partida, uma única vez — a partida já saiu do
 * polling, então não há custo recorrente de cota.
 *
 * Devolve `null` quando não dá para confiar no que voltou; quem chama cai
 * para a última observação. Nunca lança: falhar a busca do resultado não pode
 * derrubar o tick inteiro.
 */
async function fetchFinalSnapshot(matchId: string): Promise<{ goals: number | null; corners: number | null } | null> {
  try {
    const provider = getSportsDataProvider();
    const [details, rawStats] = await Promise.all([
      provider.getMatchDetails(matchId).catch(() => null),
      provider.getMatchStats(matchId).catch(() => ({}) as Record<string, { home: number | string; away: number | string }>),
    ]);

    const { stats } = normalizeLiveStats(rawStats);
    const corners =
      stats.corners_home === null || stats.corners_away === null ? null : stats.corners_home + stats.corners_away;

    const goals =
      details && details.homeScore !== null && details.awayScore !== null
        ? details.homeScore + details.awayScore
        : null;

    if (goals === null && corners === null) return null;
    return { goals, corners };
  } catch (error) {
    console.error(`[funil] falha ao buscar resultado final de ${matchId}`, error);
    return null;
  }
}

export async function settleFinishedFixtures(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - FIXTURE_FINISHED_AFTER_MINUTES * 60 * 1000).toISOString();

  // O corte é por `last_minute_changed_at`, não por `last_seen_at`.
  //
  // `last_seen_at` é renovado a cada tick para toda partida que aparece na
  // lista do dia — e jogo encerrado continua nessa lista até o dia virar.
  // Enquanto o corte foi por ele, o período de silêncio nunca acontecia e
  // NENHUM sinal era apurado: ficavam todos em PENDING e a taxa de acerto
  // não existia. `last_minute_changed_at` é o único campo que realmente para
  // quando a partida acaba. Nulo significa que nunca foi ao polling — nesse
  // caso não há sinal a resolver e só marcamos como apurada para não
  // reprocessar para sempre.
  const { data: fixtures } = await admin
    .from("funil_fixtures")
    .select("provider_match_id")
    .eq("provider", PROVIDER)
    .eq("settled", false)
    .in("status", ["finished", "postponed", "canceled"])
    .or(`last_minute_changed_at.is.null,last_minute_changed_at.lt.${cutoff}`)
    .limit(50);

  if (!fixtures || fixtures.length === 0) return 0;

  let settled = 0;
  for (const fixture of fixtures) {
    const matchId = fixture.provider_match_id;

    const { data: observations } = await admin
      .from("funil_fixture_observations")
      .select("minute, period, score_home, score_away, stats")
      .eq("provider_match_id", matchId)
      .order("collected_at", { ascending: true });

    // Sem histórico não há como apurar honestamente. Marcar como settled
    // evita reprocessar para sempre; os sinais ficam VOID logo abaixo.
    const last = observations?.[observations.length - 1];
    const lastFirstHalf = [...(observations ?? [])].reverse().find((o) => o.period === "FIRST_HALF");

    const cornersOf = (stats: Record<string, number | null> | null | undefined): number | null => {
      if (!stats) return null;
      const home = stats.corners_home;
      const away = stats.corners_away;
      return home === null || home === undefined || away === null || away === undefined ? null : home + away;
    };
    const goalsOf = (row: { score_home: number | null; score_away: number | null } | undefined): number | null =>
      !row || row.score_home === null || row.score_away === null ? null : row.score_home + row.score_away;

    const htGoals = goalsOf(lastFirstHalf);
    const htCorners = cornersOf(lastFirstHalf?.stats as Record<string, number | null> | undefined);

    // A última observação não é o resultado final: o polling só olha até o
    // minuto 90, então escanteio e gol dos acréscimos ficam de fora. Para
    // FUNIL_CORNER_FT isso inverte GREEN e RED direto. Buscamos o número
    // definitivo do provedor uma única vez, no momento de apurar, e só
    // caímos para a última observação se essa busca falhar.
    const snapshot = await fetchFinalSnapshot(matchId);
    const finalGoals = snapshot?.goals ?? goalsOf(last);
    const finalCorners = snapshot?.corners ?? cornersOf(last?.stats as Record<string, number | null> | undefined);

    const { data: signals } = await admin
      .from("live_strategy_signals")
      .select("id, entry_market, entry_line, goals_at_entry, corners_at_entry")
      .eq("provider_match_id", matchId)
      .not("entered_at", "is", null);

    // Um mercado de tempo integral só pode ser apurado se o jogo REALMENTE
    // chegou ao fim. Alguns jogos "terminam" cedo no provedor (dado congelado
    // aos 86', partida abandonada): aí o total de escanteios/gols é parcial, e
    // um FUNIL_CORNER_FT que precisava de mais um canto nos acréscimos vira RED
    // sem o jogo ter de fato acabado. Isso é erro de DADO, não do palpite —
    // então esses viram VOID (não contam na taxa) em vez de RED injusto. HT
    // não entra nessa: apura no fim do 1º tempo, que já passou.
    const FT_MARKETS = new Set(["corners_ft", "goals_rest_of_match"]);
    const lastMinute = last?.minute ?? null;
    const jogoChegouAoFim = lastMinute !== null && lastMinute >= FT_SETTLE_MIN_MINUTE;

    for (const signal of signals ?? []) {
      const market = signal.entry_market ?? "";
      let { result, resolvingEvent } = settleSignal({
        market,
        entryLine: signal.entry_line === null ? null : Number(signal.entry_line),
        goalsAtEntry: signal.goals_at_entry,
        cornersAtEntry: signal.corners_at_entry,
        goalsAtHalftime: htGoals,
        cornersAtHalftime: htCorners,
        finalGoals,
        finalCorners,
      });

      if (FT_MARKETS.has(market) && !jogoChegouAoFim && result !== "VOID") {
        result = "VOID";
        resolvingEvent = `Dado incompleto: jogo parou de atualizar aos ${lastMinute ?? "?"}' (sem tempo integral confiável)`;
      }

      await admin
        .from("signal_results")
        .upsert(
          { signal_id: signal.id, result, resolving_event: resolvingEvent, result_minute: last?.minute ?? null, resolved_at: new Date().toISOString() },
          { onConflict: "signal_id" }
        );
      settled += 1;
    }

    await admin
      .from("funil_fixtures")
      .update({
        settled: true,
        ht_goals: htGoals,
        ht_corners: htCorners,
        final_goals: finalGoals,
        final_corners: finalCorners,
      })
      .eq("provider", PROVIDER)
      .eq("provider_match_id", matchId);
  }

  return settled;
}

export async function runFunilTick(): Promise<TickSummary> {
  const summary: TickSummary = {
    fixturesRecorded: 0,
    fixturesEvaluated: 0,
    evaluations: 0,
    signalsChanged: 0,
    notificationsSent: 0,
    settled: 0,
    probes: 0,
    unmappedLabels: [],
    errors: [],
  };

  const configs = await loadStrategyConfigs();
  if (!configs) {
    summary.errors.push("strategy_configs indisponivel — rode a migration 0010");
    return summary;
  }

  const enabled = configs.filter((config) => config.enabled);
  if (enabled.length === 0) {
    summary.errors.push("nenhuma estrategia habilitada");
    return summary;
  }

  summary.fixturesRecorded = await recordTodayFixtures().catch((error) => {
    summary.errors.push(`recordTodayFixtures: ${(error as Error).message}`);
    return 0;
  });

  const collected = await collectLiveSnapshots(enabled).catch((error) => {
    summary.errors.push(`collectLiveSnapshots: ${(error as Error).message}`);
    return [];
  });
  summary.fixturesEvaluated = collected.length;

  const unmapped = new Set<string>();
  for (const fixture of collected) {
    for (const label of fixture.unmappedLabels) unmapped.add(label);
  }
  summary.unmappedLabels = [...unmapped];

  // Instrumentacao, nao decisao: mede em que minuto a casa fecha o mercado de
  // escanteios, para recalibrar a janela das estrategias com dado. Tem chave
  // propria (HOUSE_ODDS_PROBE) para poder medir sem ligar a regra de odd.
  if (houseProbeEnabled() && collected.length > 0) {
    summary.probes = await (async () => {
      const admin = createAdminSupabaseClient();
      const ids = collected.map((fixture) => fixture.snapshot.fixture.fixtureId);
      const { data: rows } = await admin
        .from("funil_fixtures")
        .select("provider_match_id, kickoff_at")
        .in("provider_match_id", ids);
      const kickoffById = new Map((rows ?? []).map((row) => [row.provider_match_id, row.kickoff_at]));

      return probeHouseMarkets(
        collected.flatMap((fixture) => {
          const kickoffAt = kickoffById.get(fixture.snapshot.fixture.fixtureId);
          if (!kickoffAt) return [];
          return [
            {
              providerMatchId: fixture.snapshot.fixture.fixtureId,
              homeTeamName: fixture.snapshot.fixture.homeTeamName,
              awayTeamName: fixture.snapshot.fixture.awayTeamName,
              kickoffAt,
              minute: fixture.snapshot.liveMinute,
            },
          ];
        })
      );
    })().catch((error) => {
      summary.errors.push(`probeHouseMarkets: ${(error as Error).message}`);
      return 0;
    });
  }

  if (collected.length > 0) {
    const admin = createAdminSupabaseClient();
    const { data: existingSignals } = await admin
      .from("live_strategy_signals")
      .select("*")
      .in("provider_match_id", collected.map((fixture) => fixture.snapshot.fixture.fixtureId));

    const signalKey = (matchId: string, strategyId: string, version: string, period: string) =>
      `${matchId}|${strategyId}|${version}|${period}`;
    const existingByKey = new Map(
      (existingSignals ?? []).map((row) => [
        signalKey(row.provider_match_id, row.strategy_id, row.strategy_version, row.period),
        row,
      ])
    );

    const now = new Date();
    for (const { snapshot } of collected) {
      for (const config of enabled) {
        const evaluation = evaluateStrategyById(config.strategyId, snapshot, config);
        summary.evaluations += 1;

        // Um sinal só nasce no banco quando tem o que contar: entrou no
        // radar, validou, ou chegou na janela e reprovou (este último é o
        // que permite calibrar limiar depois). MONITORING, EXPIRED e
        // DATA_INCOMPLETE de jogo que nunca foi acompanhado só encheriam a
        // tabela — uma estratégia de HT avaliada no segundo tempo produz
        // EXPIRED para toda partida ao vivo, todo tick.
        //
        // Já um sinal existente continua sendo atualizado em qualquer
        // estado: é assim que ele expira e para de aparecer como ativo
        // (PRD sec. 27).
        const worthPersisting =
          evaluation.state === "PRE_SIGNAL" ||
          evaluation.state === "VALIDATED" ||
          evaluation.state === "REJECTED";
        const alreadyTracked = existingByKey.has(
          signalKey(snapshot.fixture.fixtureId, config.strategyId, config.version, snapshot.period)
        );
        if (!worthPersisting && !alreadyTracked) continue;

        const existing = existingByKey.get(
          signalKey(snapshot.fixture.fixtureId, config.strategyId, config.version, snapshot.period)
        );

        try {
          const { changed, notified } = await persistEvaluation(snapshot, evaluation, config, existing, now);
          if (changed) summary.signalsChanged += 1;
          summary.notificationsSent += notified;
          if (changed && evaluation.state === "VALIDATED") {
            console.info(`[funil] ${FUNIL_LOG_CODES.STRATEGY_VALIDATED} ${config.strategyId} ${snapshot.fixture.fixtureId}`);
          }
        } catch (error) {
          summary.errors.push(`persist ${config.strategyId}/${snapshot.fixture.fixtureId}: ${(error as Error).message}`);
        }
      }
    }
  }

  summary.settled = await settleFinishedFixtures().catch((error) => {
    summary.errors.push(`settleFinishedFixtures: ${(error as Error).message}`);
    return 0;
  });

  await Promise.all([purgeOldObservations(), saveDiagnostics(collected, summary)]);
  return summary;
}

/**
 * Grava o que o último tick viu chegar do provedor.
 *
 * É a única forma de confirmar o formato real de `matches/match/stats`, que
 * nunca foi validado contra um jogo ao vivo: o painel mostra os rótulos que
 * não reconhecemos e os campos que ficaram vazios por competição, e a
 * correção é acrescentar apelido no dicionário — não mexer no motor.
 */
async function saveDiagnostics(
  collected: { snapshot: FixtureSnapshot; unmappedLabels: string[] }[],
  summary: TickSummary
): Promise<void> {
  const admin = createAdminSupabaseClient();

  const diagnostics: FunilDiagnostics = {
    at: new Date().toISOString(),
    fixturesEvaluated: summary.fixturesEvaluated,
    unmappedLabels: summary.unmappedLabels,
    competitions: collected.map(({ snapshot }) => ({
      competition: snapshot.fixture.leagueName,
      fixture: `${snapshot.fixture.homeTeamName} x ${snapshot.fixture.awayTeamName}`,
      missingFields: Object.entries(snapshot.stats)
        .filter(([, value]) => value === null)
        .map(([field]) => field),
    })),
    errors: summary.errors,
  };

  const { error } = await admin
    .from("system_settings")
    .upsert(
      { key: FUNIL_DIAGNOSTICS_KEY, value: diagnostics as unknown, updated_at: diagnostics.at },
      { onConflict: "key" }
    );
  if (error) console.error("[funil] falha ao gravar diagnostico", error);
}
