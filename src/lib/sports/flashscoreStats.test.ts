import { describe, expect, it } from "vitest";

import { mapMatchStatsPayload } from "@/lib/sports/statsPayload";
import { normalizeLiveStats } from "@/lib/funil/normalize";

/**
 * Trecho verbatim da resposta de `matches/match/stats`, capturado em
 * 12/08/2026 com Bolivar x Sao Paulo ao vivo aos 25'. Se o provedor mudar o
 * formato, é aqui que quebra — e não em silêncio, com o motor concluindo que
 * a competição não fornece estatística.
 */
const PAYLOAD_REAL = {
  match: [
    { name: "Expected goals (xG)", home_team: 0.21, away_team: 0.29 },
    { name: "Ball possession", home_team: "63%", away_team: "37%" },
    { name: "Total shots", home_team: 5, away_team: 5 },
    { name: "Shots on target", home_team: 1, away_team: 1 },
    { name: "Big chances", home_team: 0, away_team: 1 },
    { name: "Corner kicks", home_team: 3, away_team: 3 },
    { name: "Shots off target", home_team: 2, away_team: 3 },
    { name: "Passes", home_team: "90% (168/187)", away_team: "78% (83/107)" },
  ],
  "1st-half": [{ name: "Corner kicks", home_team: 2, away_team: 1 }],
};

describe("mapMatchStatsPayload", () => {
  it("le o bloco 'match' e os campos home_team/away_team do provedor", () => {
    const stats = mapMatchStatsPayload(PAYLOAD_REAL);

    expect(stats["Corner kicks"]).toEqual({ home: 3, away: 3 });
    expect(stats["Shots on target"]).toEqual({ home: 1, away: 1 });
    expect(stats["Ball possession"]).toEqual({ home: "63%", away: "37%" });
  });

  it("nao devolve mapa vazio para o formato real — a falha que derrubou o motor", () => {
    expect(Object.keys(mapMatchStatsPayload(PAYLOAD_REAL)).length).toBeGreaterThan(0);
  });

  it("segue aceitando o formato generico home/away de outros provedores", () => {
    const generico = { stats: [{ name: "Corner kicks", home: 7, away: 2 }] };
    expect(mapMatchStatsPayload(generico)["Corner kicks"]).toEqual({ home: 7, away: 2 });
  });

  it("ignora linha sem rotulo ou sem nenhum dos dois lados", () => {
    const sujo = { match: [{ home_team: 1, away_team: 2 }, { name: "Fouls" }] };
    expect(mapMatchStatsPayload(sujo)).toEqual({});
  });
});

describe("payload real chega normalizado ate o motor", () => {
  it("preenche os campos core, entao a competicao nao e marcada como sem estatistica", () => {
    const { stats, unmappedLabels } = normalizeLiveStats(mapMatchStatsPayload(PAYLOAD_REAL));

    expect(stats.corners_home).toBe(3);
    expect(stats.corners_away).toBe(3);
    expect(stats.shots_on_target_home).toBe(1);
    expect(stats.shots_off_target_away).toBe(3);
    expect(stats.possession_home).toBe(63);

    // Ataque perigoso nao existe nesta API — tem de continuar nulo sem que
    // isso derrube a avaliacao (ver REQUIRED_FIELDS em dataQuality.ts).
    expect(stats.dangerous_attacks_home).toBeNull();

    // Rotulos que nao mapeamos sao reportados, nunca engolidos.
    expect(unmappedLabels).toContain("Expected goals (xG)");
  });
});
