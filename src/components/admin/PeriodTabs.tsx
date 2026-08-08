import Link from "next/link";

export type PeriodKey = "7d" | "30d" | "90d" | "tudo";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null },
];

export interface ResolvedPeriod {
  key: PeriodKey;
  label: string;
  /** Início da janela atual (ISO) ou `null` quando o período é "tudo". */
  start: string | null;
  /** Início da janela imediatamente anterior, do mesmo tamanho, para comparação. */
  previousStart: string | null;
  /** Fim da janela anterior — é o próprio início da janela atual. */
  previousEnd: string | null;
}

/**
 * Traduz o parâmetro de URL em duas janelas: a atual e a anterior do mesmo
 * tamanho. Sem a janela anterior um número não diz nada — "1.234 contas"
 * só vira informação quando existe "1.043 no período anterior".
 */
export function resolvePeriod(raw: string | undefined): ResolvedPeriod {
  const option = PERIOD_OPTIONS.find((item) => item.key === raw) ?? PERIOD_OPTIONS[1];
  if (option.days === null) {
    return { key: option.key, label: option.label, start: null, previousStart: null, previousEnd: null };
  }

  const now = Date.now();
  const windowMs = option.days * 24 * 60 * 60 * 1000;
  const start = new Date(now - windowMs);
  const previousStart = new Date(now - windowMs * 2);

  return {
    key: option.key,
    label: option.label,
    start: start.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: start.toISOString(),
  };
}

export function PeriodTabs({ current, hrefFor }: { current: PeriodKey; hrefFor: (key: PeriodKey) => string }) {
  return (
    <div className="flex items-center gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06] p-px">
      {PERIOD_OPTIONS.map((option) => {
        const active = option.key === current;
        return (
          <Link
            key={option.key}
            href={hrefFor(option.key)}
            aria-current={active ? "true" : undefined}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-primary/12 text-primary" : "bg-sunken text-secondary hover:text-body"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
