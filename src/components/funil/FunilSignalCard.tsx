"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { STRATEGY_LABEL } from "@/lib/funil/defaults";
import { GROUP_ICON, SIGNAL_STATE_LABEL, buildChips } from "@/lib/funil/presentation";
import { STRATEGY_GROUP } from "@/lib/funil/defaults";
import type { FunilSignalView } from "@/lib/funil/view";

const STATE_STYLE: Record<string, string> = {
  ENTRY_AVAILABLE: "bg-emerald-500/15 text-emerald-300",
  VALIDATED: "bg-primary/15 text-yellow-300",
  PRE_SIGNAL: "bg-sky-500/15 text-sky-300",
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

        <div className="flex shrink-0 flex-col items-center gap-1 px-2">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {signal.scoreHome ?? 0}
            <span className="mx-1 text-faint">-</span>
            {signal.scoreAway ?? 0}
          </p>
          <span className="badge bg-red-500/15 text-[10px] text-red-300">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400 align-middle" />
            {signal.minute !== null ? `${signal.minute}'` : "AO VIVO"}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <TeamAvatar name={signal.awayTeamName} logoUrl={signal.awayTeamLogo} size={40} />
          <p className="text-xs font-semibold leading-tight text-strong">{signal.awayTeamName}</p>
        </div>
      </div>

      {signal.entryLineLabel && (
        <div className="mt-3 rounded-none border border-white/[0.06] bg-surface/60 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted">Entrada analisada</p>
          <p className="mt-0.5 text-sm font-bold text-white">{signal.entryLineLabel}</p>
          {/* Sem fonte de odds ao vivo nesta API (PRD sec. 9): mostramos a
              linha e deixamos claro que a odd tem de ser conferida na casa. */}
          <p className="mt-1 text-[11px] text-secondary">
            {signal.entryOdd !== null ? `Odd ${signal.entryOdd.toFixed(2)}` : "Consulte a odd disponível."}
          </p>
        </div>
      )}

      {signal.tpScore !== null && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">Força do sinal</p>
            <p className="text-lg font-bold tabular-nums text-white">
              {signal.tpScore}
              <span className="text-sm text-faint">/100</span>
            </p>
          </div>
          <span className="badge bg-surface-elevated text-[10px] text-secondary">
            {TP_CLASS_LABEL[signal.tpClass ?? ""] ?? signal.tpClass}
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="badge bg-surface-elevated text-[11px] text-body"
            title={chip.ok === null ? "Sem critério avaliado para este número" : undefined}
          >
            {chip.label} <span className="font-semibold tabular-nums text-white">{chip.value}</span>
            {chip.ok === true && " ✅"}
            {chip.ok === false && " ❌"}
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
