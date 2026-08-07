import { NextResponse } from "next/server";
import { getSportsDataProvider } from "@/lib/sports";
import { getOrSetCache, sportsCacheKey } from "@/lib/sports/cache";
import { getResolvedEndpoints } from "@/lib/sports/endpointResolver";
import { normalizeLiveStats } from "@/lib/funil/normalize";

/**
 * Health-check da integracao esportiva.
 *
 * Responde a pergunta que nenhum outro lugar responde: o endpoint de
 * estatistica ao vivo funciona, e com que nome ele chama cada metrica?
 * Sem isso, um caminho errado na API se manifesta como "nenhuma partida tem
 * estatistica" — igualzinho a uma competicao que de fato nao publica dados.
 *
 * Publico de proposito, e seguro por dois motivos: devolve apenas dado
 * esportivo publico (nenhuma chave, nenhum dado de usuario) e o resultado
 * inteiro fica em cache por 10 minutos, entao mil chamadas custam uma unica
 * ida a API — nao da para queimar cota por aqui.
 */
const HEALTH_CACHE_SECONDS = 600;

interface SportsHealth {
  checkedAt: string;
  liveMatches: number;
  sampledMatch: { id: string; competition: string; teams: string; minute: number | null } | null;
  statsEndpointWorks: boolean;
  /** Rotulos crus, exatamente como o provedor mandou. */
  rawLabels: string[];
  /** Rotulos que o dicionario reconheceu, e para qual campo. */
  mapped: { label: string; field: string }[];
  /** Rotulos que o dicionario NAO reconheceu — o que precisa de apelido novo. */
  unmapped: string[];
  /** Campos internos que ficaram sem valor. */
  missingFields: string[];
  resolvedEndpoints: Record<string, string>;
  error: string | null;
}

async function runHealthCheck(): Promise<SportsHealth> {
  const provider = getSportsDataProvider();
  const base: SportsHealth = {
    checkedAt: new Date().toISOString(),
    liveMatches: 0,
    sampledMatch: null,
    statsEndpointWorks: false,
    rawLabels: [],
    mapped: [],
    unmapped: [],
    missingFields: [],
    resolvedEndpoints: {},
    error: null,
  };

  // Uma partida ao vivo é o ideal (só ela tem estatística em movimento);
  // sem nenhuma, tenta a lista do dia só para saber se a API responde.
  let candidates = await provider.getLiveMatches().catch(() => []);
  base.liveMatches = candidates.length;
  if (candidates.length === 0) {
    candidates = await provider.getTodayMatches().catch(() => []);
  }

  const sample = candidates[0];
  if (!sample) {
    base.error = "Nenhuma partida disponivel para amostrar agora.";
    base.resolvedEndpoints = await getResolvedEndpoints().catch(() => ({}));
    return base;
  }

  base.sampledMatch = {
    id: sample.id,
    competition: sample.league.name,
    teams: `${sample.homeTeam.name} x ${sample.awayTeam.name}`,
    minute: sample.minute ?? null,
  };

  try {
    const rawStats = await provider.getMatchStats(sample.id);
    const { stats, mappedLabels, unmappedLabels } = normalizeLiveStats(rawStats);

    base.statsEndpointWorks = true;
    base.rawLabels = Object.keys(rawStats);
    base.mapped = mappedLabels;
    base.unmapped = unmappedLabels;
    base.missingFields = Object.entries(stats)
      .filter(([, value]) => value === null)
      .map(([field]) => field);
  } catch (error) {
    base.error = (error as Error).message;
  }

  base.resolvedEndpoints = await getResolvedEndpoints().catch(() => ({}));
  return base;
}

export async function GET() {
  const { data } = await getOrSetCache(sportsCacheKey("health"), HEALTH_CACHE_SECONDS, runHealthCheck);
  return NextResponse.json(data);
}
