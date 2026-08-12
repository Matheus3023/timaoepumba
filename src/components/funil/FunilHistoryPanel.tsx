import { STRATEGY_LABEL } from "@/lib/funil/defaults";
import type { FunilHistory, SettledSignalView, SignalResult } from "@/lib/funil/view";

/**
 * Histórico de resultado do Motor Funil.
 *
 * Existe para o produto prestar contas: o usuário vê o sinal ao vivo e
 * precisa poder conferir depois se deu certo. Os reds aparecem com o mesmo
 * peso visual dos greens de propósito — esconder erro é o que canal de
 * palpite faz, e é justamente do que a marca precisa se diferenciar.
 */

const RESULT_LABEL: Record<SignalResult, string> = {
  GREEN: "GREEN",
  RED: "RED",
  PUSH: "ANULADO",
  VOID: "CANCELADO",
};

/* PUSH e VOID ficam em cinza: não são acerto nem erro, e pintá-los de verde
   ou vermelho mentiria sobre o desempenho. */
const RESULT_COLOR: Record<SignalResult, string> = {
  GREEN: "var(--hud-on)",
  RED: "var(--hud-off)",
  PUSH: "var(--hud-dim)",
  VOID: "var(--hud-dim)",
};

function formatarAproveitamento(hitRate: number | null): string {
  /* "—" e "0%" são coisas diferentes: sem sinal resolvido não há
     aproveitamento nenhum, e mostrar 0% acusaria um desempenho que não
     aconteceu. */
  return hitRate === null ? "—" : `${Math.round(hitRate * 100)}%`;
}

export function FunilHistoryPanel({ history }: { history: FunilHistory }) {
  const { settled, byStrategy, total } = history;

  if (settled.length === 0) {
    return (
      <section>
        <p className="hud-label">Histórico de resultado</p>
        <div className="mt-3 border border-[var(--hud-rule)] bg-[var(--hud-deck)] p-6 text-center">
          <p className="text-sm leading-relaxed text-secondary">
            Nenhum sinal foi resolvido ainda.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Assim que o motor emitir um sinal e a partida terminar, o resultado aparece aqui —
            incluindo os que derem errado.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <p className="hud-label">Histórico de resultado</p>

      {/* Placar geral. O aproveitamento é o número grande porque é o que
          responde a pergunta que o usuário realmente faz. */}
      <div className="mt-3 flex items-end justify-between border border-[var(--hud-rule)] bg-[var(--hud-deck)] p-4">
        <div>
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.14em] text-muted">
            Aproveitamento
          </p>
          <p className="hud-data text-[2.5rem] font-bold leading-none text-strong">
            {formatarAproveitamento(total.hitRate)}
          </p>
        </div>
        <div className="flex gap-4">
          <Contagem rotulo="Green" valor={total.green} cor="var(--hud-on)" />
          <Contagem rotulo="Red" valor={total.red} cor="var(--hud-off)" />
          {total.neutral > 0 && (
            <Contagem rotulo="Anulado" valor={total.neutral} cor="var(--hud-dim)" />
          )}
        </div>
      </div>

      {byStrategy.length > 1 && (
        <div className="mt-3 border border-[var(--hud-rule)]">
          {byStrategy.map((tally) => (
            <div
              key={tally.strategyId}
              className="flex items-center justify-between gap-3 border-b border-[var(--hud-rule-soft)] px-3 py-2.5 last:border-b-0"
            >
              <span className="min-w-0 truncate text-[13px] text-body">
                {STRATEGY_LABEL[tally.strategyId] ?? tally.strategyId}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hud-data text-[13px] text-[var(--hud-on)]">{tally.green}</span>
                <span className="hud-data text-[13px] text-[var(--hud-off)]">{tally.red}</span>
                <span className="hud-data w-11 text-right text-[13px] font-bold text-strong">
                  {formatarAproveitamento(tally.hitRate)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-3 border border-[var(--hud-rule)]">
        {settled.map((sinal) => (
          <LinhaResultado key={sinal.id} sinal={sinal} />
        ))}
      </ul>
    </section>
  );
}

function Contagem({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.12em] text-muted">
        {rotulo}
      </span>
      <span className="hud-data text-[1.125rem] font-bold leading-none" style={{ color: cor }}>
        {valor}
      </span>
    </span>
  );
}

function LinhaResultado({ sinal }: { sinal: SettledSignalView }) {
  const cor = RESULT_COLOR[sinal.result];

  return (
    <li
      /* Faixa de 3px na esquerda: mesma gramática do card de sinal ao vivo,
         então green e red se leem de relance rolando a lista. */
      className="flex items-center gap-3 border-b border-[var(--hud-rule-soft)] border-l-[3px] px-3 py-3 last:border-b-0"
      style={{ borderLeftColor: cor }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-body">
          {sinal.homeTeamName} <span className="text-faint">x</span> {sinal.awayTeamName}
        </p>
        <p className="mt-0.5 truncate font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.12em] text-muted">
          {STRATEGY_LABEL[sinal.strategyId] ?? sinal.strategyId}
          {sinal.entryLineLabel ? ` · ${sinal.entryLineLabel}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: cor }}
        >
          {RESULT_LABEL[sinal.result]}
        </span>
        {/* Minuto da entrada e da resolução: é o que deixa auditar o sinal em
            vez de só acreditar no rótulo. */}
        <span className="hud-data text-[11px] text-muted">
          {sinal.signalMinute !== null ? `${sinal.signalMinute}'` : "—"}
          {sinal.resultMinute !== null ? ` → ${sinal.resultMinute}'` : ""}
        </span>
      </div>
    </li>
  );
}
