/**
 * Códigos de log do motor (PRD sec. 54). Ficam num lugar só para que os
 * registros gravados em `sports_api_logs` e no painel usem sempre a mesma
 * string — auditoria com código escrito de três jeitos diferentes não serve
 * para nada.
 */
export const FUNIL_LOG_CODES = {
  PROVIDER_DATA_MISSING: "PROVIDER_DATA_MISSING",
  PROVIDER_DELAY: "PROVIDER_DELAY",
  INVALID_LIVE_MINUTE: "INVALID_LIVE_MINUTE",
  INVALID_POSSESSION: "INVALID_POSSESSION",
  ODDS_UNAVAILABLE: "ODDS_UNAVAILABLE",
  MARKET_CLOSED: "MARKET_CLOSED",
  DUPLICATE_SIGNAL_BLOCKED: "DUPLICATE_SIGNAL_BLOCKED",
  STRATEGY_VALIDATED: "STRATEGY_VALIDATED",
  STRATEGY_EXPIRED: "STRATEGY_EXPIRED",
  NOTIFICATION_SENT: "NOTIFICATION_SENT",
  UNSUPPORTED_LIVE_STATS: "UNSUPPORTED_LIVE_STATS",
  SHADOW_SIGNAL: "SHADOW_SIGNAL",
} as const;

export type FunilLogCode = (typeof FUNIL_LOG_CODES)[keyof typeof FUNIL_LOG_CODES];
