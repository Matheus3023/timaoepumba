import "server-only";
/**
 * Descoberta automática dos endpoints de detalhe de partida.
 *
 * Motivo de existir: a documentação que temos do Flashscore4 cobre
 * `general/`, `teams/`, `tournaments/` e `players/`, mas NENHUM endpoint da
 * família `matches/`. Os caminhos usados pelo provider foram deduzidos, e o
 * motor Funil depende inteiramente de um deles (`stats`) — se o caminho
 * estiver errado, todo jogo vira DATA_INCOMPLETE para sempre e o sintoma é
 * indistinguível de "a competição não fornece estatística".
 *
 * Em vez de chutar um caminho e torcer, aqui tentamos os candidatos em
 * ordem e guardamos o que respondeu. O resultado fica em `system_settings`,
 * então a descoberta acontece uma vez por operação — e não a cada chamada,
 * nem a cada instância serverless.
 *
 * Quando um caminho conhecido para de responder (a API mudou), ele é
 * esquecido e a descoberta roda de novo na próxima chamada.
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type MatchOperation = "details" | "stats" | "summary" | "lineups" | "momentum" | "h2h" | "standings";

/**
 * Candidatos por operação, do mais provável para o menos.
 *
 * O primeiro de cada lista é o caminho que o provider já usava. As
 * alternativas seguem o padrão achatado que a documentação confirmada usa
 * nas outras famílias (`teams/results`, `tournaments/standings`) — que é
 * justamente o que faz `matches/match/stats`, com o segmento duplicado,
 * parecer suspeito.
 */
const CANDIDATES: Record<MatchOperation, string[]> = {
  details: ["matches/details", "matches/match/details", "matches/match"],
  stats: ["matches/match/stats", "matches/stats", "matches/statistics", "matches/match/statistics"],
  summary: ["matches/match/summary", "matches/summary", "matches/incidents", "matches/match/incidents"],
  lineups: ["matches/match/lineups", "matches/lineups", "matches/match/lineup"],
  momentum: ["matches/momentum", "matches/match/momentum"],
  h2h: ["matches/h2h", "matches/match/h2h"],
  standings: ["matches/standings", "matches/match/standings"],
};

const SETTINGS_KEY = "flashscore_match_endpoints";

/** Cache por instância, para não consultar o banco a cada chamada. */
let memoryCache: Record<string, string> | null = null;
let memoryLoadedAt = 0;
const MEMORY_TTL_MS = 5 * 60 * 1000;

async function loadResolved(): Promise<Record<string, string>> {
  if (memoryCache && Date.now() - memoryLoadedAt < MEMORY_TTL_MS) return memoryCache;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("system_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();

  // Falha de leitura não pode impedir a descoberta: seguimos sem cache, o
  // que custa algumas tentativas a mais e nada além disso.
  memoryCache = error || !data ? {} : ((data.value ?? {}) as Record<string, string>);
  memoryLoadedAt = Date.now();
  return memoryCache;
}

async function persistResolved(operation: MatchOperation, path: string): Promise<void> {
  const resolved = { ...(await loadResolved()), [operation]: path };
  memoryCache = resolved;
  memoryLoadedAt = Date.now();

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("system_settings")
    .upsert({ key: SETTINGS_KEY, value: resolved, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.error("[flashscore] falha ao gravar endpoint descoberto", error);
}

async function forget(operation: MatchOperation): Promise<void> {
  const resolved = { ...(await loadResolved()) };
  delete resolved[operation];
  memoryCache = resolved;

  const admin = createAdminSupabaseClient();
  await admin
    .from("system_settings")
    .upsert({ key: SETTINGS_KEY, value: resolved, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export interface EndpointAttempt {
  path: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface ResolveResult<T> {
  payload: T;
  path: string;
  attempts: EndpointAttempt[];
}

/**
 * Executa `operation` resolvendo o caminho.
 *
 * `fetcher` recebe um caminho candidato e devolve status + corpo, sem
 * lançar — quem decide o que é sucesso é esta função, não o chamador.
 *
 * Um 404/405 significa "caminho errado, tenta o próximo". Qualquer outro
 * erro (401 de chave, 429 de cota, 5xx) interrompe a busca imediatamente:
 * insistir nos outros candidatos só queimaria cota repetindo o mesmo erro.
 */
export async function resolveAndFetch<T>(
  operation: MatchOperation,
  fetcher: (path: string) => Promise<{ status: number; body: T }>
): Promise<ResolveResult<T>> {
  const attempts: EndpointAttempt[] = [];
  const resolved = await loadResolved();
  const known = resolved[operation];

  if (known) {
    try {
      const { status, body } = await fetcher(known);
      if (status >= 200 && status < 300) {
        return { payload: body, path: known, attempts: [{ path: known, status, ok: true }] };
      }
      attempts.push({ path: known, status, ok: false });
      // O caminho conhecido parou de responder: esquece e redescobre.
      await forget(operation);
    } catch (error) {
      attempts.push({ path: known, status: null, ok: false, error: (error as Error).message });
      await forget(operation);
    }
  }

  for (const candidate of CANDIDATES[operation]) {
    if (candidate === known) continue;

    try {
      const { status, body } = await fetcher(candidate);
      if (status >= 200 && status < 300) {
        attempts.push({ path: candidate, status, ok: true });
        await persistResolved(operation, candidate);
        console.info(`[flashscore] endpoint "${operation}" resolvido como ${candidate}`);
        return { payload: body, path: candidate, attempts };
      }

      attempts.push({ path: candidate, status, ok: false });
      if (status !== 404 && status !== 405) break;
    } catch (error) {
      attempts.push({ path: candidate, status: null, ok: false, error: (error as Error).message });
      break;
    }
  }

  const summary = attempts.map((a) => `${a.path}→${a.status ?? a.error}`).join(", ");
  console.warn(`[flashscore] nenhum endpoint respondeu para "${operation}": ${summary}`);
  throw new Error(`Flashscore4: nenhum endpoint respondeu para "${operation}" (${summary})`);
}

/** Caminhos já descobertos, para exibir no painel de diagnóstico. */
export async function getResolvedEndpoints(): Promise<Record<string, string>> {
  return loadResolved();
}

export function listEndpointCandidates(): Record<MatchOperation, string[]> {
  return CANDIDATES;
}
