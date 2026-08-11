"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { STRATEGY_LABEL } from "@/lib/funil/defaults";
import { GROUP_ICON, SIGNAL_STATE_LABEL, buildChips } from "@/lib/funil/presentation";
import { STRATEGY_GROUP } from "@/lib/funil/defaults";
import type { FunilSignalView } from "@/lib/funil/view";

/* Um estado, uma cor, e só três cores no produto inteiro (DESIGN.md sec. 1):
   verde = entrada liberada, amarelo = validado, cinza = ainda observando.
   Antes eram emerald/yellow/sky, três acentos brigando no mesmo card. */
const STATE_STYLE: Record<string, string> = {
  ENTRY_AVAILABLE: "bg-[var(--hud-on)] text-[var(--hud-void)]",
  VALIDATED: "bg-[var(--hud-live)] text-[var(--hud-void)]",
  PRE_SIGNAL: "border border-[var(--hud-rule)] text-[var(--hud-dim)]",
};

const TP_CLASS_LABEL: Record<string, string> = {
  FRACO: "FRACO",
  EM_OBSERVACAO: "EM OBSERVAÇÃO",
  FORTE: "FORTE",
  MUITO_FORTE: "MUITO FORTE",
};

/**
 * Card da tela FUNIL AO VIVO (PRD sec. 30). Mobile first: uma coluna, tudo
 * legível sem rolagem horizontal, e o número que mais importa — a linha de
 * entrada — em destaque.
 *
 * O componente não calcula nada: recebe o sinal já processado e usa
 * `buildChips` para saber quais números mostrar.
 */
export function FunilSignalCard({ signal }: { signal: FunilSignalView }) {
  const group = STRATEGY_GROUP[signal.strategyId];
  const ruleStatus = Object.fromEntries(
    signal.rules.map((rule) => [
      rule.key,
      rule.status === "pass" ? true : rule.status === "fail" ? false : null,
    ])
  );
  const chips = buildChips(signal.strategyId, signal.metrics, ruleStatus);

  return (
    <article className="card-glow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {GROUP_ICON[group]} {STRATEGY_LABEL[signal.strategyId]}
          </p>
          <p className="truncate text-xs text-muted">{signal.competition}</p>
        </div>
        <span className={`badge shrink-0 text-[10px] ${STATE_STYLE[signal.state] ?? "bg-surface-highlighted/40 text-body"}`}>
          {SIGNAL_STATE_LABEL[signal.state]}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <TeamAvatar name={signal.homeTeamName} logoUrl={signal.homeTeamLogo} size={40} />
          <p className="text-xs font-semibold leading-tight text-strong">{signal.homeTeamName}</p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 px-2">
          {/* O placar é o maior número do card: em transmissão é o primeiro
              lugar onde o olho pousa. */}
          <p className="hud-data text-[2rem] font-bold leading-none text-strong">
            {signal.scoreHome ?? 0}
            <span className="mx-1.5 text-faint">-</span>
            {signal.scoreAway ?? 0}
          </p>
          <span className="flex items-center gap-1.5 text-[var(--hud-off)]">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-[var(--hud-off)]" />
            <span className="hud-data text-[13px] font-bold">
              {signal.minute !== null ? `${signal.minute}'` : "AO VIVO"}
            </span>
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <TeamAvatar name={signal.awayTeamName} logoUrl={signal.awayTeamLogo} size={40} />
          <p className="text-xs font-semibold leading-tight text-strong">{signal.awayTeamName}</p>
        </div>
      </div>

      {signal.entryLineLabel && (
        <div className="mt-3 border border-[var(--hud-rule)] bg-[var(--hud-deck-2)] p-3 text-center">
          <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.14em] text-muted">
            Entrada analisada
          </p>
          <p className="hud-data mt-1 text-[15px] font-bold text-[var(--hud-live)]">
            {signal.entryLineLabel}
          </p>
          {/* Sem fonte de odds ao vivo nesta API (PRD sec. 9): mostramos a
              linha e deixamos claro que a odd tem de ser conferida na casa. */}
          <p className="mt-1 text-[11px] text-secondary">
            {signal.entryOdd !== null ? `Odd ${signal.entryOdd.toFixed(2)}` : "Consulte a odd disponível."}
          </p>
        </div>
      )}

      {signal.tpScore !== null && (
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-[var(--hud-rule-soft)] pt-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.14em] text-muted">
              Força do sinal
            </p>
            <p className="hud-data text-[1.5rem] font-bold leading-none text-strong">
              {signal.tpScore}
              <span className="text-[0.875rem] text-faint">/100</span>
            </p>
          </div>
          <span className="badge border border-[var(--hud-rule)] text-secondary">
            {TP_CLASS_LABEL[signal.tpClass ?? ""] ?? signal.tpClass}
          </span>
        </div>
      )}

      {/* Grade de métrica: rótulo em cima, número embaixo, divisória de 1px.
          O ✅/❌ saiu — emoji decorativo é item da checagem anti-IA. Critério
          atendido vira a barra superior acesa no acento; reprovado, vermelha;
          não avaliado, cinza. Lê mais rápido e imprime melhor. */}
      <div className="mt-3 flex flex-wrap">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="flex min-w-[4.5rem] flex-1 flex-col gap-1 border-l border-[var(--hud-rule-soft)] px-2.5 py-1 first:border-l-0 first:pl-0"
            title={chip.ok === null ? "Sem critério avaliado para este número" : undefined}
          >
            <span
              aria-hidden
              className={`h-[2px] w-full ${
                chip.ok === true
                  ? "bg-[var(--hud-on)]"
                  : chip.ok === false
                    ? "bg-[var(--hud-off)]"
                    : "bg-[var(--hud-rule)]"
              }`}
            />
            <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.12em] text-muted">
              {chip.label}
            </span>
            <span className="hud-data text-[13px] font-medium text-strong">{chip.value}</span>
          </span>
        ))}
      </div>

      <Link
        href={`/analises/funil/${signal.id}`}
        className="btn-secondary mt-3 block w-full py-2 text-center text-xs font-semibold"
      >
        VER ANÁLISE
      </Link>
    </article>
  );
}
