import { describe, expect, it } from "vitest";

import { mapAltenarEvents } from "@/lib/odds/altenarPayload";
import { matchFixtureToOdds, teamNamesMatch } from "@/lib/odds/matchOdds";
import type { FixtureKey, HouseOddsEvent } from "@/lib/odds/types";

/**
 * Recorte verbatim de `widget/GetLiveEvents?sportId=66` com `integration=bateu`,
 * capturado em 12/08/2026 às 02h. Os dois jogos são exatamente os que o Motor
 * Funil rastreava no mesmo instante — é esse par que prova que o casamento
 * entre Flashscore e Altenar fecha na prática.
 */
const PAYLOAD_ALTENAR = {
  events: [
    {
      id: 16658542,
      name: "Estudiantes de La Plata vs. Universidad Católica",
      startDate: "2026-08-12T00:30:00Z",
      competitorIds: [46827, 54983],
      marketIds: [1678847854],
      champId: 3709,
      extId: "fp32_ar:match:619358",
    },
    {
      id: 17250145,
      name: "Bolívar vs. São Paulo",
      startDate: "2026-08-12T00:30:00Z",
      competitorIds: [59014, 146472],
      marketIds: [1678847295],
      champId: 3108,
      extId: "fp32_ar:match:619355",
    },
  ],
  markets: [
    { oddIds: [4332920072, 4332920073, 4332920074], typeId: 1, id: 1678847854, name: "Vencedor do encontro" },
    { oddIds: [4332920081, 4332920082], typeId: 8, sv: "3.5", id: 1678847295, name: "Total de gols" },
  ],
  odds: [
    { typeId: 1, price: 6, competitorId: 46827, id: 4332920072, name: "Estudiantes de La Plata" },
    { typeId: 2, price: 1.1819, id: 4332920073, name: "Empate" },
    { typeId: 3, price: 21, competitorId: 54983, id: 4332920074, name: "Universidad Católica" },
    { typeId: 12, price: 2.4, id: 4332920081, name: "mais de" },
    { typeId: 13, price: 1.55, id: 4332920082, name: "menos de" },
  ],
  champs: [
    { id: 3709, name: "Copa Libertadores" },
    { id: 3108, name: "Copa Sudamericana" },
  ],
};

/** Como a Flashscore grava — abreviado, que é a raiz da dificuldade. */
const FIXTURE_BOL_SAO: FixtureKey = {
  homeTeamName: "BOL",
  awayTeamName: "SAO",
  kickoffAt: "2026-08-12T00:30:00.000Z",
};

const FIXTURE_EST_CAT: FixtureKey = {
  homeTeamName: "EST",
  awayTeamName: "CAT",
  kickoffAt: "2026-08-12T00:30:00.000Z",
};

describe("mapAltenarEvents", () => {
  it("monta o mercado seguindo marketIds -> oddIds -> price", () => {
    const [libertadores] = mapAltenarEvents(PAYLOAD_ALTENAR);

    expect(libertadores.homeTeam).toBe("Estudiantes de La Plata");
    expect(libertadores.awayTeam).toBe("Universidad Católica");
    expect(libertadores.championship).toBe("Copa Libertadores");
    expect(libertadores.markets[0].name).toBe("Vencedor do encontro");
    expect(libertadores.markets[0].selections).toEqual([
      { name: "Estudiantes de La Plata", price: 6 },
      { name: "Empate", price: 1.1819 },
      { name: "Universidad Católica", price: 21 },
    ]);
  });

  it("preserva a linha do mercado quando existe", () => {
    const sudamericana = mapAltenarEvents(PAYLOAD_ALTENAR)[1];
    expect(sudamericana.markets[0].line).toBe("3.5");
    expect(sudamericana.markets[0].name).toBe("Total de gols");
  });

  it("descarta cotacao sem preco em vez de virar zero", () => {
    const suspenso = {
      events: [{ id: 1, name: "A vs. B", startDate: "2026-08-12T00:30:00Z", marketIds: [10] }],
      markets: [{ id: 10, name: "Vencedor", oddIds: [100, 101] }],
      odds: [
        { id: 100, name: "A", price: 1.5 },
        { id: 101, name: "B", price: null },
      ],
    };
    expect(mapAltenarEvents(suspenso)[0].markets[0].selections).toEqual([{ name: "A", price: 1.5 }]);
  });

  it("ignora evento cujo nome nao separa os dois times", () => {
    const estranho = { events: [{ id: 1, name: "Torneio qualquer", startDate: "2026-08-12T00:30:00Z" }] };
    expect(mapAltenarEvents(estranho)).toEqual([]);
  });

  it("nao quebra com payload vazio ou invalido", () => {
    expect(mapAltenarEvents(null)).toEqual([]);
    expect(mapAltenarEvents({})).toEqual([]);
  });
});

describe("teamNamesMatch", () => {
  it("casa abreviacao da Flashscore com nome completo da casa", () => {
    expect(teamNamesMatch("BOL", "Bolívar")).toBe(true);
    expect(teamNamesMatch("SAO", "São Paulo")).toBe(true);
    expect(teamNamesMatch("EST", "Estudiantes de La Plata")).toBe(true);
    expect(teamNamesMatch("CAT", "Universidad Católica")).toBe(true);
  });

  it("casa nome por extenso identico nos dois lados", () => {
    expect(teamNamesMatch("Fluminense", "Fluminense")).toBe(true);
  });

  it("nao casa times diferentes que so parecem", () => {
    expect(teamNamesMatch("SAO", "Santos")).toBe(false);
    expect(teamNamesMatch("BOL", "Boca Juniors")).toBe(false);
  });

  it("recusa abreviacao curta demais, que casaria com qualquer coisa", () => {
    expect(teamNamesMatch("SP", "São Paulo")).toBe(false);
  });

  it("mantem 'Atletico' como token valido — e o que a abreviacao costuma citar", () => {
    expect(teamNamesMatch("ATL", "Atlético Mineiro")).toBe(true);
  });
});

describe("matchFixtureToOdds", () => {
  const eventos = mapAltenarEvents(PAYLOAD_ALTENAR);

  it("casa as duas partidas reais que o motor rastreava no mesmo instante", () => {
    const bol = matchFixtureToOdds(FIXTURE_BOL_SAO, eventos);
    const est = matchFixtureToOdds(FIXTURE_EST_CAT, eventos);

    expect(bol.status).toBe("matched");
    expect(est.status).toBe("matched");
    if (bol.status === "matched") expect(bol.event.homeTeam).toBe("Bolívar");
    if (est.status === "matched") expect(est.event.homeTeam).toBe("Estudiantes de La Plata");
  });

  it("nao casa quando o horario de inicio esta fora da tolerancia", () => {
    const outroHorario = { ...FIXTURE_BOL_SAO, kickoffAt: "2026-08-12T03:00:00.000Z" };
    expect(matchFixtureToOdds(outroHorario, eventos).status).toBe("not_found");
  });

  it("exige que os dois times casem, nao so o mandante", () => {
    const visitanteErrado = { ...FIXTURE_BOL_SAO, awayTeamName: "FLA" };
    expect(matchFixtureToOdds(visitanteErrado, eventos).status).toBe("not_found");
  });

  it("devolve 'ambiguous' em vez de escolher no chute", () => {
    const duplicado: HouseOddsEvent[] = [
      eventos[1],
      { ...eventos[1], providerEventId: "99999" },
    ];
    const resultado = matchFixtureToOdds(FIXTURE_BOL_SAO, duplicado);

    expect(resultado.status).toBe("ambiguous");
    if (resultado.status === "ambiguous") expect(resultado.candidates).toHaveLength(2);
  });
});
