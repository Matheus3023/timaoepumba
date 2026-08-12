import "server-only";
/**
 * Coletor do motor Funil — a única parte do motor que fala com a API e com
 * o banco. Ele monta os `FixtureSnapshot`; quem decide qualquer coisa a
 * partir deles é o código puro em `strategies/` e `engine.ts` (PRD sec. 42).
 *
 * Duas responsabilidades que valem explicação:
 *
 * 1. **Economia de chamada** (PRD sec. 55). O provedor cobra por requisição
 *    e a lista ao vivo pode ter dezenas de jogos. Só consultamos estatística
 *    de quem está dentro de alguma janela de estratégia, de competição
 *    ativa, e que não tenha sido marcado como sem estatística ao vivo.
 *
 * 2. **Memória entre coletas.** O provedor não entrega período, eventos de
 *    escanteio nem janelas de 5/10 minutos. Tudo isso sai do histórico que
 *    gravamos em `funil_fixture_observations` — é o que permite detectar
 *    intervalo (relógio travado), placar congelado, último escanteio e o
 *    T&P Momentum.
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSportsDataProvider } from "@/lib/sports";
import { CACHE_TTL_SECONDS, getOrSetCache, sportsCacheKey, sportsDayKey } from "@/lib/sports/cache";
import { normalizeLiveStats } from "@/lib/funil/normalize";
import { resolvePeriod } from "@/lib/funil/period";
import { computeMomentum, deriveLastCorner, type MomentumObservation } from "@/lib/funil/momentum";
import { globalMonitoringWindow } from "@/lib/funil/defaults";
import type { FixtureSnapshot, LiveStats, StrategyConfig } from "@/lib/funil/types";
import type { Match } from "@/lib/sports/types";
import type { FunilFixtureRow } from "@/types/database";

const PROVIDER = "flashscore4";

/** Teto de partidas consultadas por tick, para não estourar o rate limit. */
export const MAX_FIXTURES_PER_TICK = 25;

/** Quanto histórico carregar para calcular momentum de 10 minutos com folga. */
const HISTORY_WINDOW_MINUTES = 20;

/** Observações mais velhas que isto são descartadas — é dado operacional. */
export const OBSERVATION_RETENTION_HOURS = 12;

export interface CollectedFixture {
  snapshot: FixtureSnapshot;
  /** Rótulos crus que o dicionário não reconheceu, para o diagnóstico. */
  unmappedLabels: string[];
  /** True quando a competição não entregou nenhuma estatística base. */
  unsupportedLiveStats: boolean;
}

/**
 * Assinatura das estatísticas, para detectar placar congelado do provedor
 * sem guardar o objeto inteiro só para comparar.
 */
function fingerprintStats(stats: LiveStats): string {
  return Object.values(stats)
    .map((value) => (value === null ? "-" : String(value)))
    .join("|");
}

/**
 * Registra as partidas do dia com as odds PRÉ-JOGO.
 *
 * Precisa acontecer antes de o jogo começar: o payload ao vivo não traz
 * odds, e o BO (PRD sec. 6) exige justamente as pré-jogo. Usa o mesmo cache
 * que a tela /jogos já mantém quente, então não custa chamada extra.
 */
export async function recordTodayFixtures(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const provider = getSportsDataProvider();

  const { data: matches } = await getOrSetCache(
    sportsCacheKey("matches", sportsDayKey()),
    CACHE_TTL_SECONDS.todayMatches,
    () => provider.getTodayMatches()
  );

  if (matches.length === 0) return 0;

  const seenAt = new Date().toISOString();
  const rows = matches.map((match) => ({
    provider: PROVIDER,
    provider_match_id: match.id,
    league_id: match.league.id,
    league_name: match.league.name,
    country_name: match.league.country ?? null,
    home_team_id: match.homeTeam.id,
    home_team_name: match.homeTeam.name,
    home_team_logo: match.homeTeam.logoUrl ?? null,
    away_team_id: match.awayTeam.id,
    away_team_name: match.awayTeam.name,
    away_team_logo: match.awayTeam.logoUrl ?? null,
    kickoff_at: match.kickoffAt,
    status: match.status,
    last_seen_at: seenAt,
    // Só grava odds quando existem: um upsert com null apagaria as odds
    // pré-jogo assim que a partida entrasse ao vivo e o payload parasse de
    // trazê-las — e aí o BO sumiria justamente na hora de usar.
    ...(match.odds
      ? {
          pre_match_home_odd: match.odds.home,
          pre_match_draw_odd: match.odds.draw,
          pre_match_away_odd: match.odds.away,
        }
      : {}),
  }));

  const { error } = await admin
    .from("funil_fixtures")
    .upsert(rows, { onConflict: "provider,provider_match_id" });

  if (error) {
    console.error("[funil] falha ao registrar partidas do dia", error);
    return 0;
  }
  return rows.length;
}

/**
 * Escolhe quais partidas ao vivo merecem uma chamada de estatística agora.
 *
 * Fora de qualquer janela de estratégia não há nada a calcular, e consultar
 * assim mesmo só queimaria cota. Quem está mais adiantado no jogo tem
 * prioridade, porque as janelas de canto no fim são as mais curtas (86'–89')
 * e perder um tick ali custa o sinal inteiro.
 */
export function selectFixturesToPoll(
  liveMatches: Match[],
  configs: StrategyConfig[],
  unsupportedIds: Set<string>,
  maxFixtures = MAX_FIXTURES_PER_TICK
): Match[] {
  const window = globalMonitoringWindow(configs);

  return liveMatches
    .filter((match) => !unsupportedIds.has(match.id))
    .filter((match) => match.minute !== null && match.minute !== undefined)
    .filter((match) => match.minute! >= window.min && match.minute! <= window.max + 5)
    .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0))
    .slice(0, maxFixtures);
}

interface FixtureMemory {
  row: FunilFixtureRow | null;
  history: MomentumObservation[];
}

async function loadFixtureMemory(matchIds: string[]): Promise<Map<string, FixtureMemory>> {
  const admin = createAdminSupabaseClient();
  const since = new Date(Date.now() - HISTORY_WINDOW_MINUTES * 60 * 1000).toISOString();

  const [{ data: fixtures }, { data: observations }] = await Promise.all([
    admin.from("funil_fixtures").select("*").eq("provider", PROVIDER).in("provider_match_id", matchIds),
    admin
      .from("funil_fixture_observations")
      .select("provider_match_id, minute, stats, collected_at")
      .in("provider_match_id", matchIds)
      .gte("collected_at", since)
      .order("collected_at", { ascending: true }),
  ]);

  const memory = new Map<string, FixtureMemory>();
  for (const id of matchIds) memory.set(id, { row: null, history: [] });

  for (const row of fixtures ?? []) {
    memory.get(row.provider_match_id)!.row = row;
  }
  for (const observation of observations ?? []) {
    memory.get(observation.provider_match_id)?.history.push({
      minute: observation.minute,
      collectedAt: observation.collected_at,
      stats: observation.stats as unknown as LiveStats,
    });
  }

  return memory;
}

/**
 * Coleta e monta os snapshots das partidas ao vivo elegíveis.
 *
 * Uma chamada de estatística por partida. Falha numa partida não derruba o
 * tick: a partida fica de fora desta rodada e as outras seguem.
 */
export async function collectLiveSnapshots(configs: StrategyConfig[]): Promise<CollectedFixture[]> {
  const admin = createAdminSupabaseClient();
  const provider = getSportsDataProvider();

  const { data: liveMatches } = await getOrSetCache(
    sportsCacheKey("live_matches", sportsDayKey()),
    CACHE_TTL_SECONDS.liveMatches,
    () => provider.getLiveMatches()
  );
  if (liveMatches.length === 0) return [];

  const { data: unsupportedRows } = await admin
    .from("funil_fixtures")
    .select("provider_match_id")
    .eq("provider", PROVIDER)
    .eq("unsupported_live_stats", true);
  const unsupportedIds = new Set((unsupportedRows ?? []).map((row) => row.provider_match_id));

  const selected = selectFixturesToPoll(liveMatches, configs, unsupportedIds);
  if (selected.length === 0) return [];

  const memory = await loadFixtureMemory(selected.map((match) => match.id));
  const now = new Date();
  const collectedAt = now.toISOString();

  const results = await Promise.all(
    selected.map(async (match): Promise<CollectedFixture | null> => {
      let rawStats: Record<string, { home: number | string; away: number | string }>;
      try {
        rawStats = await provider.getMatchStats(match.id);
      } catch (error) {
        console.error(`[funil] falha ao buscar estatisticas de ${match.id}`, error);
        return null;
      }

      const { stats: normalized, unmappedLabels } = normalizeLiveStats(rawStats);
      const { row, history } = memory.get(match.id) ?? { row: null, history: [] };

      // Cartões vermelhos vêm no próprio objeto do time em matches/list —
      // fonte confirmada, presente em toda resposta. Preferimos ela ao
      // endpoint de estatística, que ainda não foi validado. Só usamos o
      // valor do endpoint quando o da lista vier ausente.
      const stats: LiveStats = {
        ...normalized,
        red_cards_home: match.homeRedCards ?? normalized.red_cards_home,
        red_cards_away: match.awayRedCards ?? normalized.red_cards_away,
      };

      // Há quanto tempo o minuto está no mesmo valor — é assim que o
      // intervalo é reconhecido, já que o provedor não informa período.
      const minuteFrozenForSeconds =
        row && row.last_minute === match.minute && row.last_minute_changed_at
          ? (now.getTime() - new Date(row.last_minute_changed_at).getTime()) / 1000
          : null;

      const periodInfo = resolvePeriod({
        rawMinute: match.minuteLabel ?? match.minute,
        status: match.status,
        stage: match.stage,
        minuteFrozenForSeconds,
      });

      const fingerprint = fingerprintStats(stats);
      const statsFrozenForSeconds =
        row && row.last_stats_fingerprint === fingerprint && row.last_stats_changed_at
          ? (now.getTime() - new Date(row.last_stats_changed_at).getTime()) / 1000
          : null;

      const current: MomentumObservation = { minute: periodInfo.liveMinute, collectedAt, stats };
      const momentum = computeMomentum({ current, history });
      const lastCorner = deriveLastCorner([...history, current]);

      const preMatchOdds =
        row?.pre_match_home_odd != null && row.pre_match_draw_odd != null && row.pre_match_away_odd != null
          ? { home: Number(row.pre_match_home_odd), draw: Number(row.pre_match_draw_odd), away: Number(row.pre_match_away_odd) }
          : null;

      const snapshot: FixtureSnapshot = {
        fixture: {
          fixtureId: match.id,
          leagueId: match.league.id,
          leagueName: match.league.name,
          country: match.league.country ?? null,
          homeTeamId: match.homeTeam.id,
          homeTeamName: match.homeTeam.name,
          homeTeamLogo: match.homeTeam.logoUrl ?? null,
          awayTeamId: match.awayTeam.id,
          awayTeamName: match.awayTeam.name,
          awayTeamLogo: match.awayTeam.logoUrl ?? null,
        },
        period: periodInfo.period,
        liveMinute: periodInfo.liveMinute,
        injuryTime: periodInfo.injuryTime,
        periodConfidence: periodInfo.confidence,
        scoreHome: match.homeScore,
        scoreAway: match.awayScore,
        stats,
        preMatchOdds,
        // O provedor atual não tem mercado ao vivo (ver LiveMarket).
        market: null,
        momentum,
        lastCorner,
        cornerHistoryAvailable: history.length > 0,
        collectedAt,
        // A resposta é buscada sem cache (`cache: "no-store"` no provider),
        // então acabou de chegar. Isso não garante que o provedor esteja
        // atualizando de fato — quem cobre esse caso é o campo abaixo.
        dataAgeSeconds: 0,
        statsFrozenForSeconds,
        provider: PROVIDER,
      };

      // Ataque perigoso fica fora da conta: a Flashscore nunca o publica, então
      // exigi-lo aqui marcaria toda partida como sem estatística — e esse flag
      // remove a partida do polling (ver selectFixturesToPoll).
      const unsupportedLiveStats =
        stats.shots_on_target_home === null && stats.corners_home === null;

      // Persiste a observação e a memória de congelamento. `changed_at` só
      // avança quando o valor realmente muda — se atualizássemos a cada
      // coleta, nada nunca pareceria congelado.
      await Promise.all([
        admin.from("funil_fixture_observations").insert({
          provider_match_id: match.id,
          minute: periodInfo.liveMinute,
          period: periodInfo.period,
          score_home: match.homeScore,
          score_away: match.awayScore,
          stats: stats as unknown as Record<string, number | null>,
          collected_at: collectedAt,
        }),
        admin
          .from("funil_fixtures")
          .upsert(
            {
              provider: PROVIDER,
              provider_match_id: match.id,
              status: match.status,
              last_period: periodInfo.period,
              last_minute: periodInfo.liveMinute,
              last_minute_changed_at:
                row && row.last_minute === periodInfo.liveMinute ? row.last_minute_changed_at : collectedAt,
              last_stats_fingerprint: fingerprint,
              last_stats_changed_at:
                row && row.last_stats_fingerprint === fingerprint ? row.last_stats_changed_at : collectedAt,
              unsupported_live_stats: unsupportedLiveStats,
              last_seen_at: collectedAt,
            },
            { onConflict: "provider,provider_match_id" }
          ),
      ]);

      return { snapshot, unmappedLabels, unsupportedLiveStats };
    })
  );

  return results.filter((result): result is CollectedFixture => result !== null);
}

/** Descarta observações antigas — é dado operacional, não histórico. */
export async function purgeOldObservations(): Promise<void> {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - OBSERVATION_RETENTION_HOURS * 3600 * 1000).toISOString();
  const { error } = await admin.from("funil_fixture_observations").delete().lt("collected_at", cutoff);
  if (error) console.error("[funil] falha ao limpar observacoes antigas", error);
}
