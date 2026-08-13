import type { PreLiveProjection } from "@/lib/sports/preLive";
import type { OddsMarket } from "@/lib/odds/types";
import { findHouseOddForTip } from "@/lib/sports/preLiveOdds";

/**
 * Palpite pré-jogo — o funil de PRÉ-LIVE na tela do jogo.
 *
 * Mostra a entrada mais assertiva projetada pelo histórico dos dois times
 * (ver preLive.ts) e cruza com a odd real da casa: a regra é entrar forte
 * SÓ quando o acerto histórico é alto E a odd paga o risco. Odd baixa demais
 * é sinalizada, não empurrada.
 */

const CONF_STYLE: Record<string, string> = {
  FORTE: "bg-emerald-500/20 text-emerald-300",
  BOA: "bg-primary/20 text-yellow-300",
  OBSERVACAO: "bg-surface-elevated text-secondary",
};
const CONF_LABEL: Record<string, string> = {
  FORTE: "ENTRADA FORTE",
  BOA: "ENTRADA BOA",
  OBSERVACAO: "EM OBSERVAÇÃO",
};

/** Abaixo disso a odd não paga o risco — avisamos. */
const ODD_MINIMA = 1.4;

export function PreLiveCard({
  projection,
  houseMarkets,
  houseName,
}: {
  projection: PreLiveProjection;
  houseMarkets: OddsMarket[];
  houseName: string;
}) {
  if (!projection.available) {
    return (
      <section className="card mt-4">
        <h2 className="text-sm font-semibold text-strong">🎯 Palpite pré-jogo</h2>
        <p className="mt-1 text-xs text-secondary">
          Ainda não há histórico suficiente dos dois times para uma projeção confiável deste jogo.
        </p>
      </section>
    );
  }

  const { headline } = projection;
  const odd = headline ? findHouseOddForTip(headline.market, houseMarkets) : null;
  const oddBaixa = odd !== null && odd < ODD_MINIMA;

  return (
    <section className="card-glow mt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-strong">🎯 Palpite pré-jogo</h2>
        <span className="text-[10px] text-muted">
          {projection.sample} jogos analisados · média {projection.avgGoals.toFixed(1)} gols
        </span>
      </div>

      {headline ? (
        <div
          className={`mt-3 rounded-xl border p-3 ${
            headline.confidence === "FORTE"
              ? "border-emerald-500/40 bg-emerald-500/[0.06]"
              : "border-primary/40 bg-primary/[0.05]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`badge text-[10px] font-bold ${CONF_STYLE[headline.confidence]}`}>
              {CONF_LABEL[headline.confidence]}
            </span>
            <span className="text-[11px] tabular-nums text-secondary">
              bateu em {headline.hits}/{headline.sample} ({Math.round(headline.rate * 100)}%)
            </span>
          </div>
          <p className="mt-2 text-base font-bold text-white">{headline.market}</p>
          {odd !== null ? (
            <p className={`mt-1 text-sm font-semibold ${oddBaixa ? "text-red-300" : "text-yellow-300"}`}>
              Odd na {houseName}: {odd.toFixed(2)}
              {oddBaixa && " · baixa, não compensa o risco"}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-secondary">
              Confira a odd na {houseName} — evite abaixo de {ODD_MINIMA.toFixed(2)}.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-white/[0.06] bg-surface/60 p-3 text-xs text-secondary">
          Nenhuma entrada passou o nosso filtro de confiança para este jogo. Preferimos não sugerir do que
          te dar uma entrada fraca.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {projection.tips.map((tip) => (
          <div key={tip.market} className="flex items-center gap-2">
            <span className="w-32 shrink-0 text-xs text-secondary">{tip.market}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className={`h-full rounded-full ${tip.rate >= 0.8 ? "bg-emerald-400" : tip.rate >= 0.7 ? "bg-primary" : "bg-slate-500"}`}
                style={{ width: `${Math.round(tip.rate * 100)}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-strong">
              {Math.round(tip.rate * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-snug text-faint">
        Baseado no histórico recente dos dois times e nos confrontos diretos. +18. Jogue com responsabilidade.
      </p>
    </section>
  );
}
