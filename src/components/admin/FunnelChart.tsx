import { formatNumber, formatPercent } from "@/components/admin/format";

export interface FunnelStep {
  label: string;
  value: number;
}

/**
 * Funil em barras proporcionais. O painel antes mostrava cinco linhas de
 * texto com porcentagem: a queda entre etapas só aparecia se o admin fizesse
 * a conta de cabeça. Aqui o comprimento da barra é a fatia sobre o topo do
 * funil e o número à direita é a conversão contra a etapa imediatamente
 * anterior, que é onde o vazamento aparece.
 *
 * A cor vem do par de séries validado para daltonismo (`chart-home` /
 * `chart-away`), nunca do amarelo da marca — amarelo aqui competiria com o
 * estado ativo da navegação e reprovou em contraste como cor de dado.
 */
export function FunnelChart({ steps, accent = "home" }: { steps: FunnelStep[]; accent?: "home" | "away" }) {
  const top = steps[0]?.value ?? 0;
  const barClass = accent === "home" ? "bg-chart-home" : "bg-chart-away";

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1].value : null;
        const share = top > 0 ? (step.value / top) * 100 : 0;
        const width = step.value > 0 ? Math.max(share, 1.5) : 0;

        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-[10px] tabular-nums text-faint">{index + 1}</span>
                <span className="truncate text-[13px] text-body">{step.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className="text-sm font-semibold tabular-nums text-white">{formatNumber(step.value)}</span>
                <span className="w-14 text-right font-mono text-[11px] tabular-nums text-muted">
                  {previous === null ? "topo" : formatPercent(step.value, previous, 1)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Distribuição simples (categoria + volume) para composição de base. Usa uma
 * cor por linha vinda de quem chama, porque aqui a categoria pode carregar
 * significado de estado (restrito é problema, FTD é resultado).
 */
export function DistributionBars({
  items,
}: {
  items: { label: string; value: number; barClass?: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = items.reduce((peak, item) => Math.max(peak, item.value), 0);

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const width = max > 0 && item.value > 0 ? Math.max((item.value / max) * 100, 1.5) : 0;
        return (
          <li key={item.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] text-body">{item.label}</span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className="text-sm font-semibold tabular-nums text-white">{formatNumber(item.value)}</span>
                <span className="w-14 text-right font-mono text-[11px] tabular-nums text-muted">
                  {formatPercent(item.value, total, 1)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
              <div className={`h-full rounded-full ${item.barClass ?? "bg-surface-highlighted"}`} style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
