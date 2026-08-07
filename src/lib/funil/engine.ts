/**
 * Máquina de estados do motor (PRD secs. 1, 9, 26, 27 e 28).
 *
 * Separação que o PRD faz questão de manter e que este arquivo implementa:
 * `evaluateStrategy` decide se as ESTATÍSTICAS validaram; aqui se decide o
 * ESTADO do sinal, que é onde a odd entra (VALIDATED → ENTRY_AVAILABLE), e
 * se aquilo merece notificar alguém.
 *
 * Tudo aqui continua puro — quem lê e grava é o coletor.
 */
import { FUNIL_LOG_CODES } from "@/lib/funil/logCodes";
import type { SignalState, StrategyConfig, StrategyEvaluation } from "@/lib/funil/types";

export type NotificationKind = "pre_signal" | "validated" | "entry_available";

/** Estado do sinal como está gravado hoje, para comparar com o novo. */
export interface PersistedSignalState {
  state: SignalState;
  stateChangedAt: string;
  lastNotifiedState: SignalState | null;
  lastNotifiedAt: string | null;
}

export interface TransitionDecision {
  nextState: SignalState;
  /** O estado mudou em relação ao gravado. */
  changed: boolean;
  shouldNotify: boolean;
  notificationKind: NotificationKind | null;
  /** Código de log quando a notificação foi suprimida. */
  suppressedReason: string | null;
}

/**
 * Traduz a avaliação estatística em estado de sinal.
 *
 * A odd só age nesta passagem. Sem fonte de mercado (`entryOddSatisfied`
 * nulo), o PRD sec. 9 é explícito: não bloquear o sinal estatístico. Então
 * VALIDATED promove direto para ENTRY_AVAILABLE, e o card mostra a linha
 * sugerida com "Consulte a odd disponível".
 */
export function resolveSignalState(evaluation: StrategyEvaluation): SignalState {
  if (evaluation.state !== "VALIDATED") return evaluation.state;
  if (evaluation.entryOddSatisfied === false) return "VALIDATED";
  return "ENTRY_AVAILABLE";
}

/** Ordem de progressão do funil — só avanço dispara alerta novo. */
const STATE_RANK: Record<SignalState, number> = {
  DATA_INCOMPLETE: 0,
  UNSUPPORTED_LIVE_STATS: 0,
  MONITORING: 1,
  PRE_SIGNAL: 2,
  VALIDATED: 3,
  ENTRY_AVAILABLE: 4,
  FINISHED: 5,
  EXPIRED: 0,
  REJECTED: 0,
};

const NOTIFIABLE_STATES: Partial<Record<SignalState, NotificationKind>> = {
  PRE_SIGNAL: "pre_signal",
  VALIDATED: "validated",
  ENTRY_AVAILABLE: "entry_available",
};

export interface DecideTransitionInput {
  evaluation: StrategyEvaluation;
  config: StrategyConfig;
  /** `null` na primeira vez que a partida é avaliada para esta estratégia. */
  existing: PersistedSignalState | null;
  now?: Date;
}

/**
 * Decide o próximo estado e se cabe notificar.
 *
 * Regras de alerta (PRD sec. 28):
 *  - só avanço no funil notifica; regressão (pré-sinal que esfriou) muda o
 *    estado mas não avisa ninguém;
 *  - o mesmo estado não notifica duas vezes dentro do cooldown;
 *  - shadow mode e `notification_enabled = false` nunca notificam, embora o
 *    estado continue sendo gravado normalmente.
 */
export function decideTransition(input: DecideTransitionInput): TransitionDecision {
  const now = input.now ?? new Date();
  const nextState = resolveSignalState(input.evaluation);
  const previous = input.existing;
  const changed = !previous || previous.state !== nextState;

  const kind = NOTIFIABLE_STATES[nextState] ?? null;
  const base: TransitionDecision = {
    nextState,
    changed,
    shouldNotify: false,
    notificationKind: null,
    suppressedReason: null,
  };

  if (!kind) return base;

  if (input.config.shadowMode) {
    return { ...base, suppressedReason: FUNIL_LOG_CODES.SHADOW_SIGNAL };
  }
  if (!input.config.notificationEnabled) {
    return { ...base, suppressedReason: FUNIL_LOG_CODES.DUPLICATE_SIGNAL_BLOCKED };
  }
  if (nextState === "PRE_SIGNAL" && !input.config.preSignalEnabled) {
    return { ...base, suppressedReason: FUNIL_LOG_CODES.DUPLICATE_SIGNAL_BLOCKED };
  }

  // Regressão ou permanência no mesmo patamar não é notícia nova.
  const previousRank = previous ? STATE_RANK[previous.state] : -1;
  if (STATE_RANK[nextState] <= previousRank) {
    return { ...base, suppressedReason: FUNIL_LOG_CODES.DUPLICATE_SIGNAL_BLOCKED };
  }

  // Cooldown: a API atualizar dez vezes não pode virar dez pushes.
  if (previous?.lastNotifiedState === nextState && previous.lastNotifiedAt) {
    const elapsed = (now.getTime() - new Date(previous.lastNotifiedAt).getTime()) / 1000;
    if (elapsed < input.config.cooldownSeconds) {
      return { ...base, suppressedReason: FUNIL_LOG_CODES.DUPLICATE_SIGNAL_BLOCKED };
    }
  }

  return { ...base, shouldNotify: true, notificationKind: kind };
}

/**
 * Ordenação da tela FUNIL AO VIVO (PRD sec. 29): entrada disponível,
 * validado, pré-sinal, depois T&P Score e por fim minuto da partida.
 * Fica aqui, e não no componente, para a tela não reimplementar regra.
 */
export function compareSignalsForDisplay(
  a: { state: SignalState; tpScore: number | null; minute: number | null },
  b: { state: SignalState; tpScore: number | null; minute: number | null }
): number {
  const rank = (state: SignalState) =>
    state === "ENTRY_AVAILABLE" ? 0 : state === "VALIDATED" ? 1 : state === "PRE_SIGNAL" ? 2 : 3;

  const byState = rank(a.state) - rank(b.state);
  if (byState !== 0) return byState;

  const byScore = (b.tpScore ?? -1) - (a.tpScore ?? -1);
  if (byScore !== 0) return byScore;

  return (b.minute ?? -1) - (a.minute ?? -1);
}
