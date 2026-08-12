/**
 * Achatamento do payload de estatística do provedor num mapa
 * `rótulo -> { home, away }`.
 *
 * Mora fora de `flashscoreProvider.ts` por dois motivos: aquele módulo é
 * `server-only` e não pode ser importado por teste, e foi exatamente aqui
 * que o formato real divergiu do esperado sem ninguém perceber — a função
 * devolvia `{}`, o motor concluía que a competição não tinha estatística ao
 * vivo e marcava a partida como não suportada, o que a removia do polling
 * de forma permanente. Como função pura, o formato fica preso por teste.
 *
 * Formato real da Flashscore (`matches/match/stats`):
 *   { "match": [{ name, home_team, away_team }, ...], "1st-half": [...] }
 *
 * `match` é o acumulado corrente da partida. As chaves e os nomes de campo
 * alternativos seguem cobertos para não quebrar outros provedores.
 */
export function mapMatchStatsPayload(
  payload: unknown
): Record<string, { home: number | string; away: number | string }> {
  const rows = pickStatRows(payload);

  const stats: Record<string, { home: number | string; away: number | string }> = {};
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;

    const label = ["name", "label", "title", "key"]
      .map((key) => raw[key])
      .find((value): value is string => typeof value === "string" && value.trim() !== "");
    if (!label) continue;

    const values = raw.values as Record<string, unknown> | undefined;
    const home = raw.home_team ?? raw.home ?? values?.home;
    const away = raw.away_team ?? raw.away ?? values?.away;
    if (home === undefined && away === undefined) continue;

    stats[label] = { home: coerce(home), away: coerce(away) };
  }
  return stats;
}

function coerce(value: unknown): number | string {
  return typeof value === "number" || typeof value === "string" ? value : String(value ?? "—");
}

function pickStatRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["match", "stats", "statistics", "groups"]) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}
