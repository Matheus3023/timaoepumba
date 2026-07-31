# Sports data provider integration checklist

The app depends on `SportsDataProvider` (`src/lib/sports/types.ts`), not on
any specific vendor. Today it runs on `MockSportsDataProvider`. To switch to
the real Flashscore4 API on RapidAPI:

1. Subscribe to Flashscore4 on RapidAPI and get the `X-RapidAPI-Key` /
   `X-RapidAPI-Host` values. Set them as `RAPIDAPI_KEY` / `RAPIDAPI_HOST`
   (server-only — never expose these to the browser, PRD sec. 12.1/24).
2. Open the RapidAPI console for this API and confirm, for each method in
   `src/lib/sports/flashscoreProvider.ts`, the exact endpoint path and JSON
   response shape:
   - `getTodayMatches`
   - `getLiveMatches`
   - `getMatchDetails(matchId)`
   - `getMatchEvents(matchId)`
   - `getStandings(leagueId)`
   - `getTeamDetails(teamId)`
3. Implement each method using `this.request<T>(path)`, mapping the raw
   response into the `Match` / `MatchDetails` / `Standing` / `TeamDetails`
   shapes from `src/lib/sports/types.ts`. Persist normalized
   leagues/teams/matches into the `leagues`/`teams`/`matches` tables so the
   community rooms, analyses, and CRM can reference them by internal id.
4. Set `SPORTS_DATA_PROVIDER=flashscore` in the environment. The factory in
   `src/lib/sports/index.ts` will pick it up automatically, and falls back
   to the mock provider if construction fails (missing keys, etc.).
5. Caching (`src/lib/sports/cache.ts`) and stale-data fallback (PRD sec.
   12.5) work transparently for either provider — no changes needed there.

Until this is done, do not invent endpoint paths — `FlashscoreProvider`
throws a clear "not implemented" error per method instead of guessing.
