/**
 * Ordenação da vitrine. O caso que motivou tudo isto está no primeiro
 * teste: a resposta real do provedor abre com "AFRICA: CECAFA Kagame Cup"
 * porque vem em ordem alfabética de torneio.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_PRIORITY, priorityOf, sortGroupsForDisplay, sortMatchesForDisplay } from "@/lib/sports/curationRules";
import type { Match } from "@/lib/sports/types";

function makeMatch(overrides: Partial<Match> & { league?: Partial<Match["league"]> }): Match {
  const { league, ...rest } = overrides;
  return {
    id: "m1",
    league: { id: "l1", name: "Liga Teste", country: null, ...league },
    homeTeam: { id: "h", name: "Casa" },
    awayTeam: { id: "a", name: "Fora" },
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    kickoffAt: "2026-08-07T20:00:00.000Z",
    ...rest,
  };
}

describe("ordenacao da vitrine", () => {
  it("o Brasileirao passa na frente da copa africana que a API lista primeiro", () => {
    const africa = makeMatch({ id: "africa", league: { id: "af", name: "AFRICA: CECAFA Kagame Cup" } });
    const brasileirao = makeMatch({
      id: "bra",
      league: { id: "br", name: "BRAZIL: Brasileirao Serie A", country: "Brazil" },
    });

    const ordered = sortMatchesForDisplay([africa, brasileirao], new Map(), false);
    expect(ordered[0].id).toBe("bra");
  });

  it("jogo ao vivo vem antes de qualquer competicao mais forte que ainda nao comecou", () => {
    const liveMinor = makeMatch({ id: "live", status: "live", league: { id: "x", name: "Liga Menor" } });
    const upcomingTop = makeMatch({ id: "champions", league: { id: "ch", name: "Champions League" } });

    const ordered = sortMatchesForDisplay([upcomingTop, liveMinor], new Map(), false);
    expect(ordered[0].id).toBe("live");
  });

  it("encerrado afunda para o fim", () => {
    const finished = makeMatch({ id: "fim", status: "finished", league: { id: "ch", name: "Champions League" } });
    const scheduled = makeMatch({ id: "vai", league: { id: "x", name: "Liga Menor" } });

    const ordered = sortMatchesForDisplay([finished, scheduled], new Map(), false);
    expect(ordered.map((m) => m.id)).toEqual(["vai", "fim"]);
  });

  it("a prioridade do painel vence o palpite pelo nome quando a tabela existe", () => {
    const minor = makeMatch({ id: "minor", league: { id: "x", name: "Liga Menor" } });
    const brasileirao = makeMatch({ id: "bra", league: { id: "br", name: "Brasileirao Serie A" } });

    // O admin rebaixou o Brasileirao e promoveu a liga menor.
    const priority = new Map([
      ["x", 1],
      ["br", 3],
    ]);

    const ordered = sortMatchesForDisplay([brasileirao, minor], priority, true);
    expect(ordered[0].id).toBe("minor");
  });

  it("competicao ausente da tabela cai na prioridade padrao, nao no topo", () => {
    const unknown = makeMatch({ league: { id: "desconhecida", name: "Qualquer Coisa" } });
    expect(priorityOf(unknown, new Map([["outra", 1]]), true)).toBe(DEFAULT_PRIORITY);
  });

  it("mesmo peso e mesmo estado desempatam pelo horario", () => {
    const later = makeMatch({ id: "tarde", kickoffAt: "2026-08-07T23:00:00.000Z" });
    const sooner = makeMatch({ id: "cedo", kickoffAt: "2026-08-07T18:00:00.000Z" });

    const ordered = sortMatchesForDisplay([later, sooner], new Map(), false);
    expect(ordered.map((m) => m.id)).toEqual(["cedo", "tarde"]);
  });

  it("os grupos de /jogos seguem a mesma ordem de peso", () => {
    const groups: [string, Match[]][] = [
      ["AFRICA: CECAFA Kagame Cup", [makeMatch({ league: { id: "af", name: "AFRICA: CECAFA Kagame Cup" } })]],
      ["Libertadores", [makeMatch({ league: { id: "lib", name: "CONMEBOL Libertadores" } })]],
    ];

    const ordered = sortGroupsForDisplay(groups, new Map(), false);
    expect(ordered[0][0]).toBe("Libertadores");
  });
});
