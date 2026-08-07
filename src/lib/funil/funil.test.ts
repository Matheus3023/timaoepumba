/**
 * QA OBRIGATÓRIO — os dez testes da sec. 52 do PRD, na ordem em que foram
 * especificados, mais alguns casos de borda que apareceram na implementação.
 *
 * Os números vêm literalmente do PRD: se algum deles mudar aqui sem o PRD
 * mudar junto, é bug.
 */
import { describe, expect, it } from "vitest";

import { calculateAppm, calculateBo, calculateCg, calculateRm, computeMetrics } from "@/lib/funil/metrics";
import { normalizeLiveStats, parseStatValue } from "@/lib/funil/normalize";
import { parseMinuteLabel, resolvePeriod } from "@/lib/funil/period";
import { resolveCornerAsian, resolveCornerLimit, settleSignal } from "@/lib/funil/settle";
import { decideTransition, resolveSignalState } from "@/lib/funil/engine";
import { defaultConfigFor } from "@/lib/funil/defaults";
import { evaluateCornerFTAsian, evaluateCornerHTLimit, evaluateGoalHT } from "@/lib/funil/strategies";
import { EMPTY_LIVE_STATS, type FixtureSnapshot, type LiveStats, type StrategyConfig } from "@/lib/funil/types";

function makeSnapshot(
  overrides: Omit<Partial<FixtureSnapshot>, "stats"> & { stats?: Partial<LiveStats> }
): FixtureSnapshot {
  const { stats, ...rest } = overrides;
  return {
    fixture: {
      fixtureId: "fixture-1",
      leagueId: "league-1",
      leagueName: "Campeonato Teste",
      country: "Brazil",
      homeTeamId: "home",
      homeTeamName: "Casa",
      homeTeamLogo: null,
      awayTeamId: "away",
      awayTeamName: "Fora",
      awayTeamLogo: null,
    },
    period: "FIRST_HALF",
    liveMinute: 30,
    injuryTime: null,
    periodConfidence: "high",
    scoreHome: 0,
    scoreAway: 0,
    stats: { ...EMPTY_LIVE_STATS, ...stats },
    preMatchOdds: null,
    market: null,
    momentum: null,
    lastCorner: null,
    cornerHistoryAvailable: false,
    collectedAt: new Date().toISOString(),
    dataAgeSeconds: 10,
    statsFrozenForSeconds: null,
    provider: "flashscore4",
    ...rest,
  };
}

/** Cenário do exemplo válido da sec. 8: casa dominante, tudo no limite. */
function goalHtScenario(overrides: Partial<LiveStats> = {}): FixtureSnapshot {
  return makeSnapshot({
    liveMinute: 30,
    period: "FIRST_HALF",
    preMatchOdds: { home: 1.4, draw: 4.5, away: 8.4 },
    stats: {
      dangerous_attacks_home: 42,
      dangerous_attacks_away: 20,
      possession_home: 72,
      possession_away: 28,
      shots_on_target_home: 4,
      shots_off_target_home: 5,
      corners_home: 2,
      shots_on_target_away: 1,
      shots_off_target_away: 1,
      corners_away: 1,
      ...overrides,
    },
  });
}

describe("TESTE 01 — APPM", () => {
  it("42 ataques perigosos aos 30 minutos = 1.40", () => {
    expect(calculateAppm(42, 30)).toBeCloseTo(1.4, 10);
  });

  it("minuto zero nao divide por zero, devolve null", () => {
    expect(calculateAppm(42, 0)).toBeNull();
  });

  it("ataques perigosos ausentes nao viram zero", () => {
    expect(calculateAppm(null, 30)).toBeNull();
  });
});

describe("TESTE 02 — CG", () => {
  it("4 no alvo + 5 para fora + 2 escanteios = 11", () => {
    expect(calculateCg(4, 5, 2)).toBe(11);
  });

  it("uma parcela ausente torna o CG desconhecido, nao menor", () => {
    expect(calculateCg(4, null, 2)).toBeNull();
  });
});

describe("TESTE 03 — BO", () => {
  it("zebra 9.00 sobre favorito 1.50 = 6", () => {
    expect(calculateBo({ home: 1.5, draw: 4, away: 9 })).toBeCloseTo(6, 10);
  });

  it("sem odds pre-jogo o BO e null (dado BO indisponivel)", () => {
    expect(calculateBo(null)).toBeNull();
  });
});

describe("TESTE 04 — RM", () => {
  it("APPM 1.40 x posse 72 = 100.8", () => {
    expect(calculateRm(1.4, 72)).toBeCloseTo(100.8, 10);
  });

  it("posse em fracao (0.72) e rejeitada — o PRD exige 72, nao 0.72", () => {
    expect(calculateRm(1.4, 0.72)).toBeNull();
  });
});

describe("TESTE 05 — GOL HT valida", () => {
  const config = defaultConfigFor("FUNIL_GOAL_HT");

  it("aos 30' com APPM 1.4, CG 11, BO 6 e RM 100.8 o funil valida", () => {
    const evaluation = evaluateGoalHT(goalHtScenario(), config);

    expect(evaluation.metrics.dominantTeam).toBe("home");
    expect(evaluation.metrics.dominantAppm).toBeCloseTo(1.4, 10);
    expect(evaluation.metrics.cgDominant).toBe(11);
    expect(evaluation.metrics.bo).toBeCloseTo(6, 10);
    expect(evaluation.metrics.rm).toBeCloseTo(100.8, 10);
    expect(evaluation.state).toBe("VALIDATED");
  });

  it("sem fonte de odds ao vivo o sinal estatistico nao fica preso aguardando odd", () => {
    const evaluation = evaluateGoalHT(goalHtScenario(), config);
    // PRD sec. 9: sem API de odds, nao bloquear o sinal estatistico.
    expect(evaluation.entryOddSatisfied).toBeNull();
    expect(resolveSignalState(evaluation)).toBe("ENTRY_AVAILABLE");
    expect(evaluation.entryLine?.label).toBe("⚽ +0.5 GOL HT");
  });
});

describe("TESTE 06 — GOL HT com CG 9 nunca valida", () => {
  it("mesmo cenario com CG 9 e rejeitado", () => {
    // 3 + 4 + 2 = 9, um ponto abaixo do minimo de 10.
    const snapshot = goalHtScenario({ shots_on_target_home: 3, shots_off_target_home: 4, corners_home: 2 });
    const evaluation = evaluateGoalHT(snapshot, defaultConfigFor("FUNIL_GOAL_HT"));

    expect(evaluation.metrics.cgDominant).toBe(9);
    expect(evaluation.state).toBe("REJECTED");
    expect(evaluation.state).not.toBe("VALIDATED");
    expect(resolveSignalState(evaluation)).not.toBe("ENTRY_AVAILABLE");
  });

  it("um T&P Score alto nao ressuscita um criterio reprovado", () => {
    const snapshot = goalHtScenario({ shots_on_target_home: 3, shots_off_target_home: 4, corners_home: 2 });
    const evaluation = evaluateGoalHT(snapshot, defaultConfigFor("FUNIL_GOAL_HT"));

    expect(evaluation.tpScore).not.toBeNull();
    expect(evaluation.state).toBe("REJECTED");
  });
});

describe("TESTE 07 — CANTOS HT dentro da janela", () => {
  it("aos 39' com APPM 1.1, CG 16 e placar 0x0 o funil vale", () => {
    const snapshot = makeSnapshot({
      liveMinute: 39,
      scoreHome: 0,
      scoreAway: 0,
      stats: {
        dangerous_attacks_home: 43,
        dangerous_attacks_away: 20,
        possession_home: 60,
        possession_away: 40,
        shots_on_target_home: 6,
        shots_off_target_home: 6,
        corners_home: 4,
        shots_on_target_away: 1,
        shots_off_target_away: 1,
        corners_away: 1,
      },
    });

    const evaluation = evaluateCornerHTLimit(snapshot, defaultConfigFor("FUNIL_CORNER_HT_LIMIT"));

    expect(evaluation.metrics.dominantAppm).toBeGreaterThanOrEqual(1);
    expect(evaluation.metrics.cgDominant).toBe(16);
    expect(evaluation.state).toBe("VALIDATED");
    // 5 escanteios no total → linha +0.5.
    expect(evaluation.entryLine?.label).toBe("🚩 OVER 5.5 CANTOS HT");
  });
});

describe("TESTE 08 — mesma estatistica fora da janela", () => {
  it("aos 25' nao gera entrada, no maximo segue monitorando", () => {
    const snapshot = makeSnapshot({
      liveMinute: 25,
      stats: {
        dangerous_attacks_home: 43,
        dangerous_attacks_away: 20,
        possession_home: 60,
        possession_away: 40,
        shots_on_target_home: 6,
        shots_off_target_home: 6,
        corners_home: 4,
        shots_on_target_away: 1,
        shots_off_target_away: 1,
        corners_away: 1,
      },
    });

    const evaluation = evaluateCornerHTLimit(snapshot, defaultConfigFor("FUNIL_CORNER_HT_LIMIT"));

    expect(evaluation.state).toBe("MONITORING");
    expect(resolveSignalState(evaluation)).toBe("MONITORING");
  });

  it("aos 34' entra em pre-sinal, ainda sem entrada", () => {
    const snapshot = makeSnapshot({
      liveMinute: 34,
      stats: {
        dangerous_attacks_home: 45,
        dangerous_attacks_away: 20,
        possession_home: 60,
        possession_away: 40,
        shots_on_target_home: 6,
        shots_off_target_home: 7,
        corners_home: 4,
        shots_on_target_away: 1,
        shots_off_target_away: 1,
        corners_away: 1,
      },
    });

    const evaluation = evaluateCornerHTLimit(snapshot, defaultConfigFor("FUNIL_CORNER_HT_LIMIT"));
    expect(evaluation.state).toBe("PRE_SIGNAL");
  });
});

describe("TESTE 09 — CANTOS FT asiatico", () => {
  const snapshot = makeSnapshot({
    period: "SECOND_HALF",
    liveMinute: 85,
    scoreHome: 1,
    scoreAway: 1,
    stats: {
      dangerous_attacks_home: 95,
      dangerous_attacks_away: 40,
      possession_home: 62,
      possession_away: 38,
      shots_on_target_home: 7,
      shots_off_target_home: 6,
      corners_home: 6,
      shots_on_target_away: 2,
      shots_off_target_away: 2,
      corners_away: 3,
    },
  });

  it("com 9 escanteios a linha gerada e OVER 10.0", () => {
    const evaluation = evaluateCornerFTAsian(snapshot, defaultConfigFor("FUNIL_CORNER_FT_ASIAN"));

    expect(evaluation.metrics.cornersTotal).toBe(9);
    expect(evaluation.entryLine?.line).toBe(10);
    expect(evaluation.entryLine?.label).toBe("🚩 OVER 10.0 CANTOS FT (LINHA ASIÁTICA)");
    expect(evaluation.state).toBe("VALIDATED");
  });

  it("jogo termina com 10 escanteios: PUSH", () => {
    expect(resolveCornerAsian(10, 10)).toBe("PUSH");
  });

  it("jogo termina com 11 escanteios: GREEN", () => {
    expect(resolveCornerAsian(10, 11)).toBe("GREEN");
  });

  it("jogo termina com 9 escanteios: RED", () => {
    expect(resolveCornerAsian(10, 9)).toBe("RED");
  });

  it("o limite (x.5) nunca devolve, so GREEN ou RED", () => {
    expect(resolveCornerLimit(9.5, 10)).toBe("GREEN");
    expect(resolveCornerLimit(9.5, 9)).toBe("RED");
  });
});

describe("TESTE 10 — dados ausentes", () => {
  it("dangerous_attacks null resulta em DATA_INCOMPLETE, nunca em zero", () => {
    const snapshot = goalHtScenario({ dangerous_attacks_home: null });
    const evaluation = evaluateGoalHT(snapshot, defaultConfigFor("FUNIL_GOAL_HT"));

    expect(evaluation.state).toBe("DATA_INCOMPLETE");
    expect(evaluation.metrics.appmHome).toBeNull();
    expect(evaluation.metrics.dominantTeam).toBeNull();
  });

  it("competicao sem nenhuma estatistica ao vivo e marcada como nao suportada", () => {
    const snapshot = makeSnapshot({ liveMinute: 35 });
    const evaluation = evaluateGoalHT(snapshot, defaultConfigFor("FUNIL_GOAL_HT"));

    expect(evaluation.state).toBe("UNSUPPORTED_LIVE_STATS");
    expect(evaluation.dataQuality.unsupportedLiveStats).toBe(true);
  });
});

// --- Casos de borda que a implementacao exigiu -----------------------------

describe("normalizacao", () => {
  it("reconhece o mesmo campo em portugues, ingles e camelCase", () => {
    const a = normalizeLiveStats({ "Dangerous Attacks": { home: 42, away: 20 } });
    const b = normalizeLiveStats({ "Ataques perigosos": { home: 42, away: 20 } });
    const c = normalizeLiveStats({ dangerousAttacks: { home: 42, away: 20 } });

    expect(a.stats.dangerous_attacks_home).toBe(42);
    expect(b.stats.dangerous_attacks_home).toBe(42);
    expect(c.stats.dangerous_attacks_home).toBe(42);
  });

  it("rotulo desconhecido nao vira zero e sai listado para diagnostico", () => {
    const result = normalizeLiveStats({ "Metrica Nova Do Provedor": { home: 5, away: 3 } });

    expect(result.unmappedLabels).toContain("Metrica Nova Do Provedor");
    expect(result.stats.dangerous_attacks_home).toBeNull();
  });

  it("posse com % vira numero em pontos percentuais", () => {
    const result = normalizeLiveStats({ "Ball Possession": { home: "72%", away: "28%" } });
    expect(result.stats.possession_home).toBe(72);
  });

  it("valor vazio ou tracinho e null, nao zero", () => {
    expect(parseStatValue("")).toBeNull();
    expect(parseStatValue("-")).toBeNull();
    expect(parseStatValue("—")).toBeNull();
    expect(parseStatValue(0)).toBe(0);
  });
});

describe("periodo e acrescimos", () => {
  it("45+3 continua sendo primeiro tempo", () => {
    expect(parseMinuteLabel("45+3")).toEqual({ minute: 45, injuryTime: 3, label: null });
    expect(resolvePeriod({ rawMinute: "45+3", status: "live" }).period).toBe("FIRST_HALF");
  });

  it("90+5 e segundo tempo, nao prorrogacao", () => {
    expect(resolvePeriod({ rawMinute: "90+5", status: "live" }).period).toBe("SECOND_HALF");
  });

  it("relogio travado em 45 por muito tempo e intervalo", () => {
    const info = resolvePeriod({ rawMinute: 45, status: "live", minuteFrozenForSeconds: 200 });
    expect(info.period).toBe("HALFTIME");
    expect(info.confidence).toBe("low");
  });

  it("prorrogacao e penaltis ficam fora do motor", () => {
    expect(resolvePeriod({ rawMinute: "ET", status: "live" }).period).toBe("EXTRA_TIME");
    expect(resolvePeriod({ rawMinute: "PEN", status: "live" }).period).toBe("PENALTIES");
  });

  it("no intervalo nenhuma estrategia de HT continua ativa", () => {
    const snapshot = goalHtScenario();
    const evaluation = evaluateGoalHT({ ...snapshot, period: "HALFTIME" }, defaultConfigFor("FUNIL_GOAL_HT"));
    expect(evaluation.state).toBe("EXPIRED");
  });
});

describe("deduplicacao e cooldown", () => {
  const config: StrategyConfig = {
    ...defaultConfigFor("FUNIL_GOAL_HT"),
    shadowMode: false,
    notificationEnabled: true,
  };
  const evaluation = evaluateGoalHT(goalHtScenario(), config);
  const now = new Date("2026-08-07T20:00:00Z");

  it("a primeira entrada disponivel notifica", () => {
    const decision = decideTransition({ evaluation, config, existing: null, now });
    expect(decision.nextState).toBe("ENTRY_AVAILABLE");
    expect(decision.shouldNotify).toBe(true);
  });

  it("o mesmo estado dentro do cooldown nao notifica de novo", () => {
    const decision = decideTransition({
      evaluation,
      config,
      existing: {
        state: "ENTRY_AVAILABLE",
        stateChangedAt: "2026-08-07T19:59:00Z",
        lastNotifiedState: "ENTRY_AVAILABLE",
        lastNotifiedAt: "2026-08-07T19:59:00Z",
      },
      now,
    });
    expect(decision.shouldNotify).toBe(false);
    expect(decision.suppressedReason).toBe("DUPLICATE_SIGNAL_BLOCKED");
  });

  it("evolucao real de pre-sinal para entrada notifica", () => {
    const decision = decideTransition({
      evaluation,
      config,
      existing: {
        state: "PRE_SIGNAL",
        stateChangedAt: "2026-08-07T19:55:00Z",
        lastNotifiedState: "PRE_SIGNAL",
        lastNotifiedAt: "2026-08-07T19:55:00Z",
      },
      now,
    });
    expect(decision.shouldNotify).toBe(true);
    expect(decision.notificationKind).toBe("entry_available");
  });

  it("shadow mode grava o estado mas nunca notifica", () => {
    const shadow: StrategyConfig = { ...config, shadowMode: true };
    const decision = decideTransition({ evaluation, config: shadow, existing: null, now });
    expect(decision.nextState).toBe("ENTRY_AVAILABLE");
    expect(decision.shouldNotify).toBe(false);
    expect(decision.suppressedReason).toBe("SHADOW_SIGNAL");
  });
});

describe("resolucao dos sinais", () => {
  it("gol HT ja resolvido antes da entrada vira VOID, nao GREEN", () => {
    const settled = settleSignal({
      market: "goals_ht",
      entryLine: 0.5,
      goalsAtEntry: 1,
      cornersAtEntry: 4,
      goalsAtHalftime: 1,
      cornersAtHalftime: 5,
      finalGoals: 2,
      finalCorners: 9,
    });
    expect(settled.result).toBe("VOID");
  });

  it("gol restante exige um gol DEPOIS do sinal", () => {
    const green = settleSignal({
      market: "goals_rest_of_match",
      entryLine: 0.5,
      goalsAtEntry: 2,
      cornersAtEntry: 6,
      goalsAtHalftime: 1,
      cornersAtHalftime: 5,
      finalGoals: 3,
      finalCorners: 11,
    });
    const red = settleSignal({
      market: "goals_rest_of_match",
      entryLine: 0.5,
      goalsAtEntry: 2,
      cornersAtEntry: 6,
      goalsAtHalftime: 1,
      cornersAtHalftime: 5,
      finalGoals: 2,
      finalCorners: 11,
    });
    expect(green.result).toBe("GREEN");
    expect(red.result).toBe("RED");
  });
});

describe("escanteios sequenciais", () => {
  it("sem eventos confiaveis a contagem fica null e o CG bruto e usado, com aviso", () => {
    const metrics = computeMetrics({
      stats: {
        ...EMPTY_LIVE_STATS,
        shots_on_target_home: 5,
        shots_off_target_home: 5,
        corners_home: 6,
        shots_on_target_away: 5,
        shots_off_target_away: 6,
        corners_away: 5,
        dangerous_attacks_home: 80,
        dangerous_attacks_away: 60,
      },
      liveMinute: 70,
      preMatchOdds: null,
      cornerEvents: null,
      preciseCornerEvents: false,
    });

    expect(metrics.sequentialCornerCount).toBeNull();
    expect(metrics.cgTotal).toBe(32);
    expect(metrics.cgAdjusted).toBe(32);
  });
});
