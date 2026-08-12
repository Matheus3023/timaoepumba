/**
 * Qualidade dos dados (PRD secs. 43 e 49).
 *
 * O motor só pode validar um sinal quando sabe que os dados são reais,
 * recentes e completos. Este módulo responde três perguntas separadas, que
 * costumam ser confundidas:
 *
 *  1. faltam campos obrigatórios?  → nada pode virar VALIDATED
 *  2. a competição simplesmente não fornece estatística ao vivo?
 *     → UNSUPPORTED_LIVE_STATS, e nem adianta continuar consultando
 *  3. os dados estão velhos ou congelados? → derruba a qualidade
 */
import type { DataQuality, DataQualityReport, LiveStats } from "@/lib/funil/types";

/** Acima disso o dado do provedor é velho demais para confirmar um sinal. */
export const MAX_STATS_AGE_SECONDS = 180;

/**
 * Estatísticas idênticas por tanto tempo, com o jogo correndo, indicam
 * placar congelado do provedor e não uma partida parada de verdade.
 */
export const FROZEN_STATS_SECONDS = 420;

/**
 * Campos sem os quais nenhuma das seis estratégias fecha conta.
 *
 * Ataque perigoso NÃO entra aqui: a Flashscore não publica esse rótulo em
 * nenhuma competição — não está entre os 34 que ela devolve. Enquanto esteve
 * na lista, o portão de `missingRequired` em strategies/common.ts cortava
 * toda avaliação, em todo jogo, para sempre. Pressão recente é medida por
 * chute e escanteio (ver momentum.ts) e, quando disponível, pelo endpoint
 * de momentum do provedor.
 */
const REQUIRED_FIELDS: (keyof LiveStats)[] = [
  "shots_on_target_home",
  "shots_on_target_away",
  "shots_off_target_home",
  "shots_off_target_away",
  "corners_home",
  "corners_away",
];

/** Campos que definem se a competição entrega estatística ao vivo. */
const CORE_FIELDS: (keyof LiveStats)[] = [
  "shots_on_target_home",
  "shots_on_target_away",
  "corners_home",
  "corners_away",
];

export interface DataQualityInput {
  stats: LiveStats;
  /** Idade do dado do provedor; `null` quando não dá para medir. */
  dataAgeSeconds: number | null;
  /** Há quantos segundos as estatísticas estão idênticas. */
  statsFrozenForSeconds?: number | null;
  /** `false` quando o período teve de ser inferido. */
  periodConfident: boolean;
  /** A partida está realmente ao vivo neste instante. */
  isLive: boolean;
  extraWarnings?: string[];
}

export function evaluateDataQuality(input: DataQualityInput): DataQualityReport {
  const warnings: string[] = [...(input.extraWarnings ?? [])];

  const missingRequired = REQUIRED_FIELDS.filter((field) => input.stats[field] === null);
  const unsupportedLiveStats = CORE_FIELDS.every((field) => input.stats[field] === null);

  if (unsupportedLiveStats) {
    warnings.push("Competicao nao fornece estatisticas ao vivo (ataques perigosos, chutes, escanteios).");
  } else if (missingRequired.length > 0) {
    warnings.push(`Campos ausentes no provedor: ${missingRequired.join(", ")}.`);
  }

  const age = input.dataAgeSeconds;
  const statsFresh = age !== null && age <= MAX_STATS_AGE_SECONDS;
  if (age === null) {
    warnings.push("Idade do dado desconhecida.");
  } else if (!statsFresh) {
    warnings.push(`Dado do provedor com ${Math.round(age)}s — acima do limite de ${MAX_STATS_AGE_SECONDS}s.`);
  }

  const frozenFor = input.statsFrozenForSeconds;
  const frozen = frozenFor !== null && frozenFor !== undefined && frozenFor >= FROZEN_STATS_SECONDS;
  if (frozen) {
    warnings.push(`Estatisticas identicas ha ${Math.round(frozenFor!)}s — possivel congelamento do provedor.`);
  }

  if (!input.periodConfident) {
    warnings.push("Periodo da partida inferido, nao informado pelo provedor.");
  }
  if (!input.isLive) {
    warnings.push("Partida nao esta ao vivo.");
  }

  let quality: DataQuality = "HIGH";
  if (unsupportedLiveStats || missingRequired.length > 0 || !input.isLive || frozen) {
    quality = "LOW";
  } else if (!statsFresh || !input.periodConfident) {
    quality = "MEDIUM";
  }

  return { quality, missingRequired: missingRequired as string[], warnings, unsupportedLiveStats, statsFresh };
}

/**
 * Nenhum sinal vira VALIDATED com qualidade LOW (PRD sec. 43). Isolado numa
 * função para que a regra exista num lugar só e não seja reescrita
 * ligeiramente diferente em cada estratégia.
 */
export function canConfirmSignal(report: DataQualityReport): boolean {
  return report.quality !== "LOW";
}
