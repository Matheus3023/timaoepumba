/**
 * Camada de normalização (PRD sec. 3).
 *
 * O provedor devolve as estatísticas como uma lista de rótulos livres
 * ("Dangerous Attacks", "Ataques perigosos", "dangerousAttacks"…), e esses
 * rótulos variam por idioma, por competição e às vezes entre respostas.
 * Aqui traduzimos tudo para o padrão interno de `LiveStats`.
 *
 * Duas regras inegociáveis:
 *  - rótulo que não reconhecemos NÃO vira zero, vira `null`;
 *  - valor vazio/"-"/"—" também é `null`, não zero.
 *
 * O que não foi reconhecido volta em `unmappedLabels` para alimentar o
 * diagnóstico de campos do painel — é assim que o dicionário abaixo é
 * completado com dados reais em vez de chute.
 */
import type { LiveStats } from "@/lib/funil/types";
import { EMPTY_LIVE_STATS } from "@/lib/funil/types";

/** Campos de `LiveStats` sem o sufixo _home/_away. */
type StatField =
  | "dangerous_attacks"
  | "attacks"
  | "possession"
  | "shots_on_target"
  | "shots_off_target"
  | "shots_total"
  | "corners"
  | "red_cards";

/**
 * Reduz um rótulo a uma chave comparável: minúsculas, sem acentos e sem
 * nada que não seja letra ou número. Assim "Ataques Perigosos",
 * "ataques_perigosos" e "dangerousAttacks" colapsam em algo estável, e o
 * dicionário não precisa listar cada variação de pontuação.
 */
export function slugifyStatLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Dicionário rótulo → campo interno. Cobre inglês e português porque a
 * resposta do Flashscore4 muda de idioma conforme a competição, e as
 * variações camelCase/snake_case citadas no PRD.
 */
const LABEL_ALIASES: Record<string, StatField> = {};

function registerAliases(field: StatField, labels: string[]): void {
  for (const label of labels) {
    LABEL_ALIASES[slugifyStatLabel(label)] = field;
  }
}

registerAliases("dangerous_attacks", [
  "Dangerous Attacks",
  "dangerousAttacks",
  "dangerous_attacks",
  "Ataques perigosos",
  "Ataques Perigosos",
  "Ataques de perigo",
]);

registerAliases("attacks", ["Attacks", "attacks", "Ataques"]);

registerAliases("possession", [
  "Ball Possession",
  "ball_possession",
  "ballPossession",
  "Possession",
  "Posse de bola",
  "Posse",
]);

registerAliases("shots_on_target", [
  "Shots on Goal",
  "Shots on Target",
  "shots_on_goal",
  "shots_on_target",
  "shotsOnGoal",
  "shotsOnTarget",
  "Chutes no gol",
  "Chutes a gol",
  "Finalizacoes no gol",
  "Finalizacoes certas",
  "Remates a baliza",
]);

registerAliases("shots_off_target", [
  "Shots off Goal",
  "Shots off Target",
  "shots_off_goal",
  "shots_off_target",
  "shotsOffGoal",
  "shotsOffTarget",
  "Chutes para fora",
  "Chutes fora",
  "Finalizacoes para fora",
  "Remates fora",
]);

registerAliases("shots_total", [
  "Goal Attempts",
  "Total Shots",
  "shots_total",
  "totalShots",
  "goalAttempts",
  "Finalizacoes",
  "Chutes",
  "Remates",
]);

registerAliases("corners", [
  "Corner Kicks",
  "Corners",
  "corner_kicks",
  "cornerKicks",
  "Escanteios",
  "Cantos",
  "Pontapes de canto",
]);

registerAliases("red_cards", [
  "Red Cards",
  "red_cards",
  "redCards",
  "Cartoes vermelhos",
  "Cartao vermelho",
  "Expulsoes",
]);

/**
 * Converte o valor cru num número.
 *
 * Aceita "72%", " 12 " e 12. Devolve `null` para vazio, "-", "—" e
 * qualquer coisa que não vire número finito — nunca zero por omissão.
 * "45/60" (formato de acerto de passes) também vira null: o primeiro
 * número isolado seria enganoso.
 */
export function parseStatValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "—" || trimmed === "–") return null;
  if (trimmed.includes("/")) return null;

  const cleaned = trimmed.replace("%", "").replace(",", ".").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export interface NormalizeResult {
  stats: LiveStats;
  /** Rótulos que o dicionário não reconheceu — insumo do diagnóstico. */
  unmappedLabels: string[];
  /** Rótulos reconhecidos, para conferir o que a competição realmente entrega. */
  mappedLabels: { label: string; field: StatField }[];
}

/**
 * Traduz o `Record<rótulo, {home, away}>` do provedor para `LiveStats`.
 *
 * Campo que não apareceu na resposta permanece `null`. Se o mesmo campo
 * aparecer duas vezes (acontece quando a resposta traz blocos por período),
 * o primeiro vence — o coletor só pede estatística acumulada do jogo.
 */
export function normalizeLiveStats(
  raw: Record<string, { home: number | string; away: number | string }> | null | undefined
): NormalizeResult {
  const stats: LiveStats = { ...EMPTY_LIVE_STATS };
  const unmappedLabels: string[] = [];
  const mappedLabels: { label: string; field: StatField }[] = [];

  if (!raw) return { stats, unmappedLabels, mappedLabels };

  for (const [label, values] of Object.entries(raw)) {
    const field = LABEL_ALIASES[slugifyStatLabel(label)];
    if (!field) {
      unmappedLabels.push(label);
      continue;
    }

    const homeKey = `${field}_home` as keyof LiveStats;
    const awayKey = `${field}_away` as keyof LiveStats;
    if (stats[homeKey] !== null || stats[awayKey] !== null) continue;

    stats[homeKey] = parseStatValue(values?.home);
    stats[awayKey] = parseStatValue(values?.away);
    mappedLabels.push({ label, field });
  }

  return { stats, unmappedLabels, mappedLabels };
}
