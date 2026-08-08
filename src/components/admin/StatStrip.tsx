import type { ReactNode } from "react";
import { formatNumber } from "@/components/admin/format";

/**
 * Faixa de indicadores. É uma régua única dividida por fios de 1px em vez de
 * seis cartões soltos: o painel é ferramenta de trabalho, e cartão com
 * sombra e respiro próprio custa altura de tela sem acrescentar informação.
 * As linhas do grid são o próprio fundo do contêiner aparecendo pelo
 * `gap-px`, o que mantém o fio correto mesmo quando a grade quebra em duas
 * fileiras no celular.
 */
export function StatStrip({ children, columns = 6 }: { children: ReactNode; columns?: 3 | 4 | 5 | 6 }) {
  const columnClass = {
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-3 xl:grid-cols-6",
  }[columns];

  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] ${columnClass}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  delta,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  /** Variação percentual contra o período anterior. `null` = sem base de comparação. */
  delta?: number | null;
  tone?: "default" | "accent";
}) {
  return (
    <div className="bg-sunken px-3.5 py-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
      <p
        className={`mt-1 text-[26px] font-semibold leading-none tabular-nums ${
          tone === "accent" ? "text-primary" : "text-white"
        }`}
      >
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <div className="mt-1.5 flex min-h-4 items-center gap-1.5">
        {delta !== undefined && delta !== null && <DeltaTag value={delta} />}
        {hint && <span className="truncate text-[11px] text-muted">{hint}</span>}
      </div>
    </div>
  );
}

function DeltaTag({ value }: { value: number }) {
  const rounded = Math.round(value);
  const tone =
    rounded > 0 ? "text-success" : rounded < 0 ? "text-error" : "text-muted";
  const arrow = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "=";

  return (
    <span className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${tone}`}>
      <span aria-hidden>{arrow}</span> {Math.abs(rounded)}%
    </span>
  );
}
