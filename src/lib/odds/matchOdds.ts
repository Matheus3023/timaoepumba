import type { FixtureKey, HouseOddsEvent, OddsMatchResult } from "@/lib/odds/types";

/**
 * Casamento entre a partida da Flashscore e o evento da casa.
 *
 * Não existe id em comum entre os dois lados: a Altenar carrega um `extId` de
 * outro provedor (`ar:match:619355`) e a Flashscore usa id próprio
 * (`MFVi7lV9`). Sobra casar por nome de time e horário de início.
 *
 * O que torna isso espinhoso é que a Flashscore guarda o time **abreviado**
 * ("BOL", "SAO") enquanto a Altenar traz o nome inteiro ("Bolívar", "São
 * Paulo") — e as abreviações dos dois nem coincidem: para Estudiantes de La
 * Plata a Flashscore diz "EST" e a Altenar diz "ELP". Por isso comparamos a
 * abreviação contra os *tokens* do nome completo, por prefixo.
 *
 * A regra é deliberadamente conservadora. Errar o casamento é pior do que não
 * casar: significaria exibir a odd de outro jogo ao lado de um sinal. Então,
 * havendo mais de um candidato, devolvemos "ambiguous" e ninguém escolhe por
 * sorteio.
 */

/** Minutos de diferença tolerados entre os dois provedores no horário de início. */
export const KICKOFF_TOLERANCE_MINUTES = 15;

/** Abreviação curta demais casa com qualquer coisa; "SP" pegaria meio mundo. */
const MIN_ABBREVIATION_LENGTH = 3;

export function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Só ruído estrutural entra aqui: artigo, preposição e sufixo societário.
 *
 * "Atlético", "Deportivo" e afins ficam de fora de propósito — parecem
 * genéricos, mas são justamente a parte que a abreviação costuma citar
 * ("ATL" -> "Atlético Mineiro"). Removê-los transformaria casamento válido em
 * silêncio. A proteção contra homônimo não vem daqui: vem de exigir os dois
 * times e o horário, e de devolver "ambiguous" quando sobra mais de um.
 */
const STOPWORDS = new Set([
  "de", "do", "da", "des", "del", "la", "el", "los", "las", "of", "the",
  "fc", "cf", "ac", "sc", "ec", "afc", "cd", "club", "clube",
]);

function significantTokens(value: string): string[] {
  return normalizeTeamName(value)
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

/**
 * `ours` é o lado Flashscore (curto), `theirs` o lado da casa (completo).
 * Casa quando os nomes normalizados batem, ou quando a abreviação é prefixo
 * de algum token relevante do nome completo — "bol" -> "bolivar",
 * "cat" -> "catolica", "sao" -> "sao paulo".
 */
export function teamNamesMatch(ours: string, theirs: string): boolean {
  const short = normalizeTeamName(ours).replace(/ /g, "");
  if (short.length < MIN_ABBREVIATION_LENGTH) return false;

  const fullNormalized = normalizeTeamName(theirs);
  if (fullNormalized.replace(/ /g, "") === short) return true;

  return significantTokens(theirs).some(
    (token) => token.startsWith(short) || short.startsWith(token)
  );
}

function minutesApart(a: string, b: string): number {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return Number.isFinite(diff) ? diff / 60000 : Number.POSITIVE_INFINITY;
}

export function matchFixtureToOdds(
  fixture: FixtureKey,
  events: HouseOddsEvent[],
  toleranceMinutes = KICKOFF_TOLERANCE_MINUTES
): OddsMatchResult {
  const candidates = events.filter((event) => {
    if (minutesApart(event.startsAt, fixture.kickoffAt) > toleranceMinutes) return false;
    return (
      teamNamesMatch(fixture.homeTeamName, event.homeTeam) &&
      teamNamesMatch(fixture.awayTeamName, event.awayTeam)
    );
  });

  if (candidates.length === 1) return { status: "matched", event: candidates[0] };
  if (candidates.length === 0) return { status: "not_found" };
  return { status: "ambiguous", candidates };
}
