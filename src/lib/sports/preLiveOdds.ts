import type { OddsMarket } from "@/lib/odds/types";

/**
 * Cruza a entrada sugerida do pré-live com a odd REAL da Bateu que a página
 * já carregou, para a gente não sugerir cegamente: mostra a cotação e deixa
 * filtrar odd baixa demais (que não paga o risco).
 *
 * É best-effort e tolerante a nome: a casa (Altenar) rotula os mercados de
 * formas variadas ("Total de gols", "Mais/Menos", "Ambas equipes marcam"),
 * então casamos por palavra-chave + linha, e se não achar, devolve null e a
 * UI cai no aviso genérico de conferir na casa.
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Uma seleção é "over/sim" (o lado que a gente sugere). */
function isOverSide(name: string): boolean {
  const n = norm(name);
  return n.includes("mais") || n.includes("over") || n.includes("acima") || n === "sim" || n.includes("ambas");
}

export function findHouseOddForTip(market: string, houseMarkets: OddsMarket[]): number | null {
  // Descobre a linha alvo a partir do rótulo do tip.
  const linha = market.includes("2.5") ? "2.5" : market.includes("1.5") ? "1.5" : null;
  const btts = norm(market).includes("ambas");

  for (const m of houseMarkets) {
    const nome = norm(m.name);

    if (btts) {
      if (!nome.includes("ambas")) continue;
      const sel = m.selections.find((s) => norm(s.name) === "sim" || norm(s.name).includes("sim"));
      if (sel && sel.price > 1) return sel.price;
      continue;
    }

    // Over de gols: mercado de total, na linha certa, lado "mais".
    const ehTotalGols = (nome.includes("total") || nome.includes("mais") || nome.includes("gol")) && !nome.includes("escanteio") && !nome.includes("canto") && !nome.includes("cartao");
    if (!ehTotalGols) continue;
    if (linha && (m.line ?? "").replace(",", ".") !== linha) continue;
    const sel = m.selections.find((s) => isOverSide(s.name));
    if (sel && sel.price > 1) return sel.price;
  }
  return null;
}
