/**
 * Período da partida (PRD secs. 45–48).
 *
 * O provedor não entrega período — só um `live_minute` que às vezes vem
 * como número e às vezes como "45+3". O PRD é claro: período vale mais que
 * minuto cru. 45+3 é primeiro tempo, 90+5 é segundo tempo, e prorrogação e
 * pênaltis ficam inteiramente fora do motor.
 *
 * Como o período é inferido e não lido, toda inferência frágil sai marcada
 * com `confidence: "low"` para quem consome decidir o quanto confiar.
 */
import type { MatchPeriod, PeriodInfo } from "@/lib/funil/types";

/** Rótulos que algumas respostas usam no lugar do minuto. */
const HALFTIME_LABELS = ["ht", "halftime", "half time", "intervalo", "descanso", "pausa"];
const PENALTIES_LABELS = ["pen", "pens", "penalties", "penaltis", "disputa de penaltis"];
const EXTRA_TIME_LABELS = ["et", "aet", "extra time", "prorrogacao"];

/**
 * Quanto tempo o minuto precisa ficar congelado em 45 para tratarmos como
 * intervalo. O relógio do provedor costuma parar em 45 durante o descanso
 * sem nenhum outro sinal, e um intervalo dura ~15 min — dois minutos parados
 * já são bem mais que a variação normal entre coletas.
 */
export const HALFTIME_FREEZE_SECONDS = 120;

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Separa minuto regulamentar de acréscimos: "45+3" → 45 e 3.
 * Um minuto simples devolve `injuryTime: null` (não 0) — não sabemos se
 * havia acréscimo, só que não foi informado.
 */
export function parseMinuteLabel(raw: number | string | null | undefined): {
  minute: number | null;
  injuryTime: number | null;
  label: string | null;
} {
  if (raw === null || raw === undefined) return { minute: null, injuryTime: null, label: null };

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? { minute: raw, injuryTime: null, label: null } : { minute: null, injuryTime: null, label: null };
  }

  const trimmed = raw.trim();
  if (trimmed === "") return { minute: null, injuryTime: null, label: null };

  const plus = trimmed.match(/^(\d+)\s*\+\s*(\d+)/);
  if (plus) {
    return { minute: Number(plus[1]), injuryTime: Number(plus[2]), label: null };
  }

  const plain = trimmed.match(/^(\d+)/);
  if (plain) {
    return { minute: Number(plain[1]), injuryTime: null, label: null };
  }

  return { minute: null, injuryTime: null, label: normalizeLabel(trimmed) };
}

/**
 * `match_status.stage` do provedor. Confirmado presente numa resposta real
 * (valor "Finished" numa partida encerrada); os demais valores são o que a
 * Flashscore usa na interface. Quando bate, vale mais que qualquer
 * inferência pelo minuto — e o que não bate é simplesmente ignorado, nunca
 * chuta um período.
 */
const STAGE_TO_PERIOD: Record<string, MatchPeriod> = {
  finished: "FINISHED",
  "after extra time": "FINISHED",
  "after penalties": "FINISHED",
  "1st half": "FIRST_HALF",
  "first half": "FIRST_HALF",
  "2nd half": "SECOND_HALF",
  "second half": "SECOND_HALF",
  "half time": "HALFTIME",
  halftime: "HALFTIME",
  "extra time": "EXTRA_TIME",
  "1st extra time": "EXTRA_TIME",
  "2nd extra time": "EXTRA_TIME",
  penalties: "PENALTIES",
  "penalty shootout": "PENALTIES",
};

export function periodFromStage(stage: string | null | undefined): MatchPeriod | null {
  if (!stage) return null;
  return STAGE_TO_PERIOD[normalizeLabel(stage)] ?? null;
}

export interface ResolvePeriodInput {
  rawMinute: number | string | null | undefined;
  status: "scheduled" | "live" | "finished" | "postponed" | "canceled";
  /** `match_status.stage`, quando o provedor mandar. */
  stage?: string | null;
  /**
   * Há quantos segundos o minuto está travado no mesmo valor, medido pelo
   * histórico dos nossos snapshots. `null` quando não acompanhamos o jogo
   * tempo suficiente para saber.
   */
  minuteFrozenForSeconds?: number | null;
}

export function resolvePeriod(input: ResolvePeriodInput): PeriodInfo {
  const { minute, injuryTime, label } = parseMinuteLabel(input.rawMinute);

  // O período informado ganha de qualquer dedução nossa. Só entra quando
  // reconhecemos o valor: um `stage` desconhecido não vira palpite.
  const staged = periodFromStage(input.stage);
  if (staged) {
    return { period: staged, liveMinute: minute, injuryTime, confidence: "high" };
  }

  if (input.status === "finished") {
    return { period: "FINISHED", liveMinute: minute, injuryTime, confidence: "high" };
  }
  if (input.status === "scheduled") {
    return { period: "PRE_MATCH", liveMinute: null, injuryTime: null, confidence: "high" };
  }
  if (input.status === "postponed" || input.status === "canceled") {
    return { period: "UNKNOWN", liveMinute: null, injuryTime: null, confidence: "high" };
  }

  if (label) {
    if (HALFTIME_LABELS.includes(label)) {
      return { period: "HALFTIME", liveMinute: 45, injuryTime: null, confidence: "high" };
    }
    if (PENALTIES_LABELS.includes(label)) {
      return { period: "PENALTIES", liveMinute: null, injuryTime: null, confidence: "high" };
    }
    if (EXTRA_TIME_LABELS.includes(label)) {
      return { period: "EXTRA_TIME", liveMinute: null, injuryTime: null, confidence: "high" };
    }
    return { period: "UNKNOWN", liveMinute: null, injuryTime: null, confidence: "low" };
  }

  if (minute === null) {
    return { period: "UNKNOWN", liveMinute: null, injuryTime: null, confidence: "low" };
  }

  // 45+X continua sendo primeiro tempo, por mais alto que o acréscimo seja.
  if (injuryTime !== null && minute <= 45) {
    return { period: "FIRST_HALF", liveMinute: minute, injuryTime, confidence: "high" };
  }
  if (injuryTime !== null && minute <= 90) {
    return { period: "SECOND_HALF", liveMinute: minute, injuryTime, confidence: "high" };
  }

  if (minute < 45) {
    return { period: "FIRST_HALF", liveMinute: minute, injuryTime, confidence: "high" };
  }

  if (minute === 45) {
    // Relógio parado em 45 sem acréscimo indicado: é o descanso.
    const frozen = input.minuteFrozenForSeconds;
    if (frozen !== null && frozen !== undefined && frozen >= HALFTIME_FREEZE_SECONDS) {
      return { period: "HALFTIME", liveMinute: 45, injuryTime: null, confidence: "low" };
    }
    return { period: "FIRST_HALF", liveMinute: 45, injuryTime, confidence: "high" };
  }

  if (minute <= 90) {
    return { period: "SECOND_HALF", liveMinute: minute, injuryTime, confidence: "high" };
  }

  // Acima de 90 sem notação de acréscimo, o mais provável é prorrogação.
  // Errar para o lado de excluir é seguro: ET está fora do motor de todo
  // jeito, então o pior caso é deixar de analisar, nunca analisar errado.
  return { period: "EXTRA_TIME", liveMinute: minute, injuryTime, confidence: "low" };
}

/** Só primeiro e segundo tempo entram no motor (PRD secs. 46–48). */
export function isFunilEligiblePeriod(period: MatchPeriod): boolean {
  return period === "FIRST_HALF" || period === "SECOND_HALF";
}
