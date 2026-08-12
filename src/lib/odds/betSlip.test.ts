import { describe, expect, it } from "vitest";

import {
  combinedOdds,
  isSelected,
  potentialReturn,
  toggleSelection,
  type SlipSelection,
} from "@/lib/odds/betSlip";

const base = { eventId: "17338785", eventName: "RU Irún x CA Osasuna B" };

const vencedorCasa: SlipSelection = {
  ...base,
  marketId: "m1",
  marketName: "Vencedor do encontro",
  line: null,
  selectionName: "RU Irún",
  odd: 2.4,
  providerOddId: "9001",
};

const vencedorFora: SlipSelection = {
  ...base,
  marketId: "m1",
  marketName: "Vencedor do encontro",
  line: null,
  selectionName: "CA Osasuna B",
  odd: 3.1,
  providerOddId: "9002",
};

const maisDe25: SlipSelection = {
  ...base,
  marketId: "m2",
  marketName: "Total de gols",
  line: "2.5",
  selectionName: "Mais de 2.5",
  odd: 1.75,
  providerOddId: "9003",
};

describe("boletim — composição", () => {
  it("adiciona seleção", () => {
    expect(toggleSelection([], vencedorCasa)).toEqual([vencedorCasa]);
  });

  /**
   * A regra que evita mostrar bilhete que a casa recusaria: ninguém aposta
   * em "Mais de 2.5" e "Menos de 2.5" ao mesmo tempo.
   */
  it("seleção do MESMO mercado substitui a anterior, nunca soma", () => {
    const slip = toggleSelection([vencedorCasa], vencedorFora);

    expect(slip).toHaveLength(1);
    expect(slip[0].selectionName).toBe("CA Osasuna B");
  });

  it("mercados diferentes convivem na mesma múltipla", () => {
    const slip = toggleSelection([vencedorCasa], maisDe25);
    expect(slip).toHaveLength(2);
  });

  it("clicar de novo na mesma seleção remove", () => {
    expect(toggleSelection([vencedorCasa], vencedorCasa)).toEqual([]);
  });

  it("isSelected reflete o que está no boletim", () => {
    const slip = [vencedorCasa];
    expect(isSelected(slip, "m1", "RU Irún")).toBe(true);
    expect(isSelected(slip, "m1", "CA Osasuna B")).toBe(false);
    expect(isSelected(slip, "m2", "Mais de 2.5")).toBe(false);
  });
});

describe("boletim — cálculo", () => {
  it("múltipla multiplica as cotações", () => {
    expect(combinedOdds([vencedorCasa, maisDe25])).toBeCloseTo(4.2, 5);
  });

  it("uma seleção só devolve a própria cotação", () => {
    expect(combinedOdds([maisDe25])).toBe(1.75);
  });

  /**
   * Produto vazio é 1 na matemática, mas aqui 1 faria a tela mostrar
   * "retorno = valor apostado" sem nenhuma seleção marcada.
   */
  it("boletim vazio vale 0, não 1", () => {
    expect(combinedOdds([])).toBe(0);
    expect(potentialReturn([], 100)).toBe(0);
  });

  it("retorno potencial e valor apostado", () => {
    expect(potentialReturn([maisDe25], 50)).toBe(87.5);
    expect(potentialReturn([vencedorCasa, maisDe25], 10)).toBe(42);
  });

  /** Mostrar retorno maior do que a casa paga destrói confiança. */
  it("arredonda o centavo para BAIXO", () => {
    const odd: SlipSelection = { ...maisDe25, odd: 1.333 };
    expect(potentialReturn([odd], 10)).toBe(13.33);
  });

  it("valor invalido ou zerado nao vira retorno", () => {
    expect(potentialReturn([maisDe25], 0)).toBe(0);
    expect(potentialReturn([maisDe25], -10)).toBe(0);
    expect(potentialReturn([maisDe25], Number.NaN)).toBe(0);
  });
});
