import type { AccessLevel } from "@/types/database";

/**
 * Regras PURAS de nível de acesso e da porta de entrada do app.
 *
 * Mora separado de `rules.ts` e `gate.ts` porque aqueles são `server-only`
 * (tocam banco) e, por isso, não podem ser importados por teste nem por
 * componente de cliente. A decisão "esse usuário pode entrar?" é lógica de
 * negócio pura e precisa estar coberta por teste — é ela que decide se o
 * app abre ou não para quem chega pelo tráfego pago.
 */

/**
 * Ranking (PRD sec. 10). Maior = mais recursos. Permite responder "esse
 * nível satisfaz aquele mínimo?" sem espalhar regra feature a feature — a
 * lista de features por nível vive na tabela `entitlements`.
 */
const LEVEL_RANK: Record<AccessLevel, number> = {
  VISITOR: 0,
  APP_USER: 1,
  REGISTERED_USER: 2,
  FTD_USER: 3,
  ADMIN: 4,
  RESTRICTED_USER: -1, // sempre abaixo de tudo, independente do progresso anterior
};

export function accessLevelSatisfies(current: AccessLevel, required: AccessLevel): boolean {
  if (current === "RESTRICTED_USER") return false;
  return LEVEL_RANK[current] >= LEVEL_RANK[required];
}

/** Nível exigido para usar o app. Abaixo disso, cai na tela de liberação. */
export const REQUIRED_LEVEL: AccessLevel = "REGISTERED_USER";

/**
 * Interruptor de emergência.
 *
 * O portão inteiro depende de um sinal externo (o postback da casa) chegar.
 * Se ele parar — macro trocada, pixel desativado, plataforma fora do ar —
 * TODO usuário legítimo fica trancado do lado de fora, inclusive quem já se
 * cadastrou. Quando isso acontece não dá para esperar deploy: basta setar
 * ACCESS_GATE_ENABLED=false na Vercel e o app volta a abrir para todos.
 *
 * Ligado por padrão: a ausência da variável não pode desligar uma regra de
 * negócio sem alguém ter decidido isso. Só a string "false" desliga.
 */
export function accessGateEnabled(): boolean {
  return process.env.ACCESS_GATE_ENABLED !== "false";
}

export function needsRegistration(level: AccessLevel | null | undefined): boolean {
  if (!accessGateEnabled()) return false;
  if (!level) return true;
  return !accessLevelSatisfies(level, REQUIRED_LEVEL);
}

/**
 * True quando `next` é promoção sobre `current`. RESTRICTED_USER é sempre
 * aplicável (é punição da moderação, não progresso), por isso conta como
 * mudança válida mesmo estando abaixo de tudo.
 */
export function isUpgrade(current: AccessLevel, next: AccessLevel): boolean {
  if (next === "RESTRICTED_USER") return true;
  return LEVEL_RANK[next] > LEVEL_RANK[current];
}
