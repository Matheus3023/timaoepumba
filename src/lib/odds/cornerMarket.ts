import type { HouseOddsEvent, OddsMarket } from "@/lib/odds/types";

/**
 * Encontra, entre os mercados da casa, a cotação de "mais de X escanteios"
 * correspondente à linha que a estratégia quer entrar.
 *
 * As estratégias de canto só sabem dizer "linha 10.5". Quem traduz isso para
 * uma cotação concreta na Bateu Bet é este módulo — e ele é conservador: se
 * não encontrar exatamente a linha pedida, devolve `null` em vez de sugerir a
 * linha vizinha. Entrar em 11.5 achando que era 10.5 é pior do que não ter
 * cotação, porque a apuração depois resolve contra a linha errada (foi
 * exatamente esse tipo de deslize que transformou GREEN em RED na apuração).
 */

/** Rótulos da casa que representam "acima da linha". */
const OVER_PREFIXES = ["mais de", "acima de", "over", "+"];

function isOverSelection(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return OVER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Extrai a linha numérica de um rótulo ("Mais de 10.5" -> 10.5).
 * A casa escreve a linha no próprio rótulo da seleção, e nem sempre no campo
 * `line` do mercado — o mercado carrega só a linha principal.
 */
export function parseSelectionLine(name: string): number | null {
  const match = name.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Serve só o mercado de escanteios TOTAL da partida.
 *
 * Duas exclusões que parecem detalhe e não são:
 *
 * - Mercado por time ("Real Salt Lake total de escanteios") também casa a
 *   linha pedida e devolveria uma cotação de outro mercado. É o erro mais
 *   fácil de cometer aqui e o mais difícil de perceber depois.
 * - "ímpar/par" é comparado por palavra inteira, não por `includes("par")`,
 *   que derrubaria "1ª parte" junto.
 */
function isTotalCornerMarket(market: OddsMarket, event: HouseOddsEvent): boolean {
  const haystack = normalize(`${market.group ?? ""} ${market.name}`);
  if (!haystack.includes("escanteio") && !haystack.includes("corner")) return false;
  if (/\b(impar|par|odd|even)\b/.test(haystack)) return false;

  for (const team of [event.homeTeam, event.awayTeam]) {
    const normalizedTeam = normalize(team);
    if (normalizedTeam && haystack.includes(normalizedTeam)) return false;
  }
  return true;
}

export interface CornerOddMatch {
  line: number;
  odd: number;
  marketName: string;
}

/**
 * Cotação de "mais de `targetLine` escanteios" no evento da casa.
 * `null` quando a casa não oferece exatamente essa linha.
 */
export function findCornerOverOdd(event: HouseOddsEvent, targetLine: number): CornerOddMatch | null {
  for (const market of event.markets) {
    if (!isTotalCornerMarket(market, event)) continue;

    for (const selection of market.selections) {
      if (!isOverSelection(selection.name)) continue;
      const line = parseSelectionLine(selection.name);
      if (line === null || line !== targetLine) continue;
      return { line, odd: selection.price, marketName: market.name };
    }
  }
  return null;
}

/** Todas as linhas de escanteio que a casa está oferecendo, para diagnóstico. */
export function listCornerLines(event: HouseOddsEvent): number[] {
  const lines = new Set<number>();
  for (const market of event.markets) {
    if (!isTotalCornerMarket(market, event)) continue;
    for (const selection of market.selections) {
      if (!isOverSelection(selection.name)) continue;
      const line = parseSelectionLine(selection.name);
      if (line !== null) lines.add(line);
    }
  }
  return [...lines].sort((a, b) => a - b);
}
