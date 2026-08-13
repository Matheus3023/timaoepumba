import type { HeadToHeadMatch } from "@/lib/sports/types";

/**
 * Funil de PRÉ-LIVE: projeção da partida ANTES do apito.
 *
 * A pesquisa de mercado é clara sobre onde mora a assertividade no pré-jogo:
 * os mercados de OVER DE GOLS têm as maiores taxas de acerto históricas
 * (Over 1.5 bate ~77% no mundo; Over 0.5 ainda mais), e a forma de acertar é
 * só entrar quando o histórico dos dois times sustenta — e curar, mostrar só
 * o que é forte, nunca todo jogo.
 *
 * Por isso este motor NÃO usa caixa-preta: ele calcula a taxa EMPÍRICA de
 * cada mercado nos últimos jogos dos dois times + os confrontos diretos, e só
 * destaca a entrada quando essa taxa passa um limiar alto. O número que a
 * galera vê é o histórico real — "8 dos últimos 10 jogos tiveram +1.5" — não
 * uma probabilidade inventada.
 *
 * Fonte de dados: o que a página do jogo já carrega (recentes + H2H), custo
 * zero de API. Não cobre escanteios ainda: a lista de jogos recentes só traz
 * placar, e contagem de escanteios por jogo exigiria uma chamada por partida.
 */

export type PreLiveConfidence = "FORTE" | "BOA" | "OBSERVACAO";

export interface PreLiveTip {
  market: string;
  /** Fração 0..1 dos jogos da amostra em que o mercado bateu. */
  rate: number;
  /** Quantos jogos da amostra bateram / total. */
  hits: number;
  sample: number;
}

export interface PreLiveProjection {
  available: boolean;
  /** Jogos usados (recentes dos dois times + H2H, com placar válido). */
  sample: number;
  avgGoals: number;
  tips: PreLiveTip[];
  /** A entrada sugerida — a mais forte que passou o limiar, ou null. */
  headline: (PreLiveTip & { confidence: PreLiveConfidence }) | null;
}

/** Amostra mínima para uma taxa não ser ruído. */
const MIN_SAMPLE = 4;
/** Limiar de confiança: só vira entrada destacada acima disto. */
const FORTE = 0.8;
const BOA = 0.7;

function totalGoals(m: HeadToHeadMatch): number | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  return m.homeScore + m.awayScore;
}

function classify(rate: number): PreLiveConfidence | null {
  if (rate >= FORTE) return "FORTE";
  if (rate >= BOA) return "BOA";
  return null;
}

export function projectPreLive(input: {
  homeRecent: HeadToHeadMatch[];
  awayRecent: HeadToHeadMatch[];
  h2h: HeadToHeadMatch[];
}): PreLiveProjection {
  const pool = [...input.homeRecent, ...input.awayRecent, ...input.h2h];
  const totals: number[] = [];
  let bttsHits = 0;

  for (const m of pool) {
    const t = totalGoals(m);
    if (t === null) continue;
    totals.push(t);
    if ((m.homeScore ?? 0) > 0 && (m.awayScore ?? 0) > 0) bttsHits += 1;
  }

  const sample = totals.length;
  if (sample < MIN_SAMPLE) {
    return { available: false, sample, avgGoals: 0, tips: [], headline: null };
  }

  const rateOver = (line: number) => totals.filter((t) => t > line).length / sample;
  const hitsOver = (line: number) => totals.filter((t) => t > line).length;
  const avgGoals = totals.reduce((a, b) => a + b, 0) / sample;

  const tips: PreLiveTip[] = [
    { market: "Mais de 0.5 gol", rate: rateOver(0.5), hits: hitsOver(0.5), sample },
    { market: "Mais de 1.5 gols", rate: rateOver(1.5), hits: hitsOver(1.5), sample },
    { market: "Mais de 2.5 gols", rate: rateOver(2.5), hits: hitsOver(2.5), sample },
    { market: "Ambas marcam", rate: bttsHits / sample, hits: bttsHits, sample },
  ];

  // Entrada sugerida: assertiva MAS com odd que valha a pena. Over 0.5 fica
  // fora do destaque (bate quase sempre e paga quase nada). Entre os que
  // passam o limiar de acerto, preferimos a linha de ODD MAIOR — mercado mais
  // difícil que AINDA bate ≥70% rende bem mais que o over seguro e mixuruca.
  // Só cai no over seguro quando os de odd melhor não passam. Se nada passa,
  // honesto: sem entrada de confiança para este jogo.
  const ODD_RANK: Record<string, number> = {
    "Mais de 2.5 gols": 3,
    "Ambas marcam": 3,
    "Mais de 1.5 gols": 2,
  };
  const candidatos = tips
    .filter((t) => t.market !== "Mais de 0.5 gol")
    .filter((t) => t.rate >= BOA)
    .sort((a, b) => (ODD_RANK[b.market] ?? 0) - (ODD_RANK[a.market] ?? 0) || b.rate - a.rate);

  const escolhido = candidatos[0] ?? null;
  const headline =
    escolhido && classify(escolhido.rate)
      ? { ...escolhido, confidence: classify(escolhido.rate)! }
      : null;

  return { available: true, sample, avgGoals, tips, headline };
}
