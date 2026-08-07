/**
 * Núcleo compartilhado das seis estratégias.
 *
 * `evaluateStrategy` é função pura: recebe um `FixtureSnapshot` e um
 * `StrategyConfig` e devolve a avaliação. Não conhece React, Supabase nem
 * a API — é o que permite rodar o mesmo motor sobre partida ao vivo e sobre
 * partida histórica (PRD secs. 40 e 42).
 *
 * Duas decisões que valem explicação, porque não são óbvias:
 *
 * 1. `state` daqui nunca é ENTRY_AVAILABLE. A promoção VALIDATED →
 *    ENTRY_AVAILABLE depende da odd e é da máquina de estados (PRD secs. 9
 *    e 13): a odd nunca interfere no cálculo estatístico.
 *
 * 2. Critério que não pôde ser avaliado por falta de dado ("unavailable")
 *    não reprova a estratégia. O PRD sec. 8 diz "todos os critérios
 *    obrigatórios DISPONÍVEIS", e a sec. 6 manda sinalizar "Dado BO
 *    indisponível" em vez de rejeitar. O que protege contra sinal em cima
 *    de dado faltando é o portão de campos obrigatórios (`dataQuality`),
 *    que roda antes e derruba para DATA_INCOMPLETE. Quem quiser endurecer
 *    um critério específico usa `block_on_unavailable` no painel.
 */
import { canConfirmSignal, evaluateDataQuality } from "@/lib/funil/dataQuality";
import { computeMetrics } from "@/lib/funil/metrics";
import { isFunilEligiblePeriod } from "@/lib/funil/period";
import { calculateTPScore } from "@/lib/funil/tpScore";
import { STRATEGY_GROUP } from "@/lib/funil/defaults";
import type {
  EntryLine,
  FixtureSnapshot,
  FunilMetrics,
  MatchPeriod,
  RuleResult,
  RuleStatus,
  StrategyConfig,
  StrategyEvaluation,
  StrategyId,
} from "@/lib/funil/types";

export interface StrategyContext {
  snapshot: FixtureSnapshot;
  config: StrategyConfig;
  metrics: FunilMetrics;
  minute: number;
}

export interface StrategyDefinition {
  strategyId: StrategyId;
  /** Período em que a estratégia opera — HT ou FT. */
  requiredPeriod: Extract<MatchPeriod, "FIRST_HALF" | "SECOND_HALF">;
  /** CG usado pelo T&P Score: dominante (padrão) ou somado (Gol FT). */
  cgBasis: "dominant" | "total";
  /** Critérios estatísticos, sem a janela de minuto (tratada pelo núcleo). */
  buildRules(context: StrategyContext): RuleResult[];
  /** Linha sugerida de entrada; `null` quando não dá para montar. */
  buildEntryLine(context: StrategyContext): EntryLine | null;
}

/** Comparação numérica que devolve "unavailable" em vez de reprovar sem dado. */
export function compareRule(
  key: string,
  label: string,
  value: number | null,
  threshold: number | null | undefined,
  comparator: "gte" | "gt",
  detail?: string
): RuleResult {
  if (threshold === null || threshold === undefined) {
    return { key, label, value, threshold: null, status: "not_evaluated", detail };
  }
  if (value === null) {
    return { key, label, value: null, threshold, status: "unavailable", detail };
  }
  const pass = comparator === "gte" ? value >= threshold : value > threshold;
  return { key, label, value, threshold, status: pass ? "pass" : "fail", detail };
}

/**
 * Critério de odd. Hoje a API do projeto não fornece odds ao vivo nem linha
 * de escanteios, então isto fica sempre "not_evaluated" — e, conforme o PRD
 * sec. 9, NÃO bloqueia o sinal estatístico. Assim que existir fonte de
 * mercado, o campo `snapshot.market` passa a preencher e a regra funciona
 * sem mais nenhuma mudança.
 */
export function buildOddRule(context: StrategyContext): RuleResult {
  const minOdd = context.config.params.min_odd;
  if (minOdd === null || minOdd === undefined) {
    return { key: "odd", label: "Odd de referência", value: null, threshold: null, status: "not_evaluated" };
  }

  const market = context.snapshot.market;
  if (!market || market.currentOdd === null || market.currentOdd === undefined) {
    return {
      key: "odd",
      label: "Odd de referência",
      value: null,
      threshold: minOdd,
      status: "not_evaluated",
      detail: "Consulte a odd disponível.",
    };
  }
  if (market.marketStatus === "closed") {
    return {
      key: "odd",
      label: "Odd de referência",
      value: market.currentOdd,
      threshold: minOdd,
      status: "fail",
      detail: "Mercado fechado.",
    };
  }
  return compareRule("odd", "Odd de referência", market.currentOdd, minOdd, "gte");
}

function windowRule(context: StrategyContext): RuleResult {
  const { min_minute: min, max_minute: max } = context.config.params;
  const inside = context.minute >= min && context.minute <= max;
  return {
    key: "window",
    label: "Janela operacional",
    value: `${context.minute}'`,
    threshold: `${min}'–${max}'`,
    status: inside ? "pass" : "fail",
  };
}

function blocking(rule: RuleResult, blockOnUnavailable: string[]): boolean {
  if (rule.status === "fail") return true;
  return rule.status === "unavailable" && blockOnUnavailable.includes(rule.key);
}

function unavailableWarnings(rules: RuleResult[]): string[] {
  return rules
    .filter((rule) => rule.status === "unavailable")
    .map((rule) => `Critério ${rule.label} indisponível — dado ausente no provedor.`);
}

/**
 * Avalia uma estratégia contra um snapshot. Ver o cabeçalho do arquivo para
 * as duas regras que governam o resultado.
 */
export function evaluateStrategy(
  definition: StrategyDefinition,
  snapshot: FixtureSnapshot,
  config: StrategyConfig
): StrategyEvaluation {
  const metrics = computeMetrics({
    stats: snapshot.stats,
    liveMinute: snapshot.liveMinute,
    preMatchOdds: snapshot.preMatchOdds,
    cornerEvents: snapshot.lastCorner ? [snapshot.lastCorner] : null,
    // Os escanteios que derivamos do delta entre snapshots não têm precisão
    // de evento, então nunca alimentam a contagem de sequenciais.
    preciseCornerEvents: false,
  });

  const dataQuality = evaluateDataQuality({
    stats: snapshot.stats,
    dataAgeSeconds: snapshot.dataAgeSeconds,
    statsFrozenForSeconds: snapshot.statsFrozenForSeconds,
    periodConfident: snapshot.periodConfidence === "high",
    isLive: isFunilEligiblePeriod(snapshot.period),
    extraWarnings:
      metrics.sequentialCornerCount === null
        ? ["Sequência de escanteios não disponível no provedor."]
        : [],
  });

  const base = {
    strategyId: definition.strategyId,
    strategyVersion: config.version,
    group: STRATEGY_GROUP[definition.strategyId],
    period: snapshot.period,
    minute: snapshot.liveMinute,
    metrics,
    dataQuality,
    entryLine: null,
    entryOddSatisfied: null,
    tpScore: null,
  } as const;

  // --- Portões que impedem qualquer avaliação estatística ------------------

  if (dataQuality.unsupportedLiveStats) {
    return {
      ...base,
      state: "UNSUPPORTED_LIVE_STATS",
      rules: [],
      warnings: dataQuality.warnings,
      reason: "Competição não fornece estatísticas ao vivo.",
    };
  }

  if (snapshot.period === "UNKNOWN") {
    return {
      ...base,
      state: "DATA_INCOMPLETE",
      rules: [],
      warnings: dataQuality.warnings,
      reason: "Período da partida desconhecido.",
    };
  }

  if (snapshot.period !== definition.requiredPeriod) {
    // O período da estratégia ainda vai chegar → seguimos monitorando.
    // Já passou (ou é prorrogação/pênaltis, fora do motor) → expirou.
    const stillAhead =
      snapshot.period === "PRE_MATCH" ||
      (definition.requiredPeriod === "SECOND_HALF" &&
        (snapshot.period === "FIRST_HALF" || snapshot.period === "HALFTIME"));

    return {
      ...base,
      state: stillAhead ? "MONITORING" : "EXPIRED",
      rules: [],
      warnings: dataQuality.warnings,
      reason: stillAhead
        ? "Aguardando o período da estratégia."
        : "Período da estratégia encerrado.",
    };
  }

  if (snapshot.liveMinute === null) {
    return {
      ...base,
      state: "DATA_INCOMPLETE",
      rules: [],
      warnings: dataQuality.warnings,
      reason: "Minuto da partida indisponível.",
    };
  }

  if (dataQuality.missingRequired.length > 0) {
    // Aqui mora o TESTE 10: dangerous_attacks ausente jamais vira zero e
    // jamais produz sinal.
    return {
      ...base,
      state: "DATA_INCOMPLETE",
      rules: [],
      warnings: dataQuality.warnings,
      reason: `Dados obrigatórios ausentes: ${dataQuality.missingRequired.join(", ")}.`,
    };
  }

  // --- Avaliação estatística ----------------------------------------------

  const context: StrategyContext = { snapshot, config, metrics, minute: snapshot.liveMinute };
  const statRules = definition.buildRules(context);
  const window = windowRule(context);
  const rules = [...statRules, window];

  const blockOnUnavailable = config.params.block_on_unavailable ?? [];
  const warnings = [...dataQuality.warnings, ...unavailableWarnings(statRules)];

  const oddRule = statRules.find((rule) => rule.key === "odd");
  const entryOddSatisfied: boolean | null =
    !oddRule || oddRule.status === "not_evaluated" ? null : oddRule.status === "pass";

  const scoreContextRule = statRules.find((rule) => rule.key === "score_context");
  const totalDangerousAttacks =
    snapshot.stats.dangerous_attacks_home === null || snapshot.stats.dangerous_attacks_away === null
      ? null
      : snapshot.stats.dangerous_attacks_home + snapshot.stats.dangerous_attacks_away;

  const tpScore = calculateTPScore({
    metrics,
    params: config.params,
    momentum: snapshot.momentum,
    liveMinute: snapshot.liveMinute,
    totalDangerousAttacks,
    scoreContextStatus: (scoreContextRule?.status ?? null) as RuleStatus | null,
    oddStatus: (oddRule?.status ?? null) as RuleStatus | null,
    dataQuality: dataQuality.quality,
    cgBasis: definition.cgBasis,
  });

  const entryLine = definition.buildEntryLine(context);
  const withResults = { ...base, rules, warnings, entryLine, entryOddSatisfied, tpScore };

  const failed = statRules.filter((rule) => blocking(rule, blockOnUnavailable));

  // Depois da janela: o sinal morre, não importa quão boas estejam as
  // estatísticas (PRD sec. 27 — nunca deixar sinal antigo parecendo ativo).
  if (context.minute > config.params.max_minute) {
    return { ...withResults, state: "EXPIRED", reason: "Janela operacional encerrada." };
  }

  // Antes da janela: no máximo pré-sinal, e só se tudo o mais já passa.
  if (context.minute < config.params.min_minute) {
    const lead = config.params.pre_signal_lead_minutes ?? 0;
    const insideLead = context.minute >= config.params.min_minute - lead;
    const eligible = config.preSignalEnabled && insideLead && failed.length === 0;
    return {
      ...withResults,
      state: eligible ? "PRE_SIGNAL" : "MONITORING",
      reason: eligible
        ? "Jogo entrando no radar. Aguardando janela operacional."
        : "Fora da janela operacional.",
    };
  }

  // Dentro da janela.
  if (failed.length > 0) {
    return {
      ...withResults,
      state: "REJECTED",
      reason: `Critérios não atendidos: ${failed.map((rule) => rule.label).join(", ")}.`,
    };
  }

  if (!canConfirmSignal(dataQuality)) {
    return {
      ...withResults,
      state: "DATA_INCOMPLETE",
      reason: "Qualidade dos dados insuficiente para confirmar o sinal.",
    };
  }

  return { ...withResults, state: "VALIDATED", reason: null };
}
