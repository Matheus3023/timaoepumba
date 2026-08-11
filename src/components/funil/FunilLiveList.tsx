"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { FunilSignalCard } from "@/components/funil/FunilSignalCard";
import { STRATEGY_GROUP, STRATEGY_GROUP_LABEL } from "@/lib/funil/defaults";
import { formatAge } from "@/lib/funil/presentation";
import type { StrategyGroup } from "@/lib/funil/types";
import type { FunilSignalView } from "@/lib/funil/view";

const TABS: { key: StrategyGroup | "ALL"; label: string }[] = [
  { key: "ALL", label: "TODOS" },
  { key: "GOAL_HT", label: `⚽ ${STRATEGY_GROUP_LABEL.GOAL_HT}` },
  { key: "GOAL_FT", label: `⚽ ${STRATEGY_GROUP_LABEL.GOAL_FT}` },
  { key: "CORNER_HT", label: `🚩 ${STRATEGY_GROUP_LABEL.CORNER_HT}` },
  { key: "CORNER_FT", label: `🚩 ${STRATEGY_GROUP_LABEL.CORNER_FT}` },
];

/**
 * Lista da tela FUNIL AO VIVO.
 *
 * A ordenação já vem pronta do servidor (`compareSignalsForDisplay`), então
 * aqui só há filtro de aba e atualização.
 *
 * Atualiza via Realtime chamando `router.refresh()` em vez de aplicar o
 * payload direto: a linha que chega pelo Realtime não traz nome nem escudo
 * dos times, que vivem em `funil_fixtures` (service-role). Refazer a
 * renderização no servidor é mais simples e mais barato do que buscar cada
 * partida no cliente — e o RLS garante que só sinal fora do shadow mode
 * chega até aqui.
 */
export function FunilLiveList({ signals }: { signals: FunilSignalView[] }) {
  const [tab, setTab] = useState<StrategyGroup | "ALL">("ALL");
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("funil_live_signals")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_strategy_signals" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Relógio próprio para o "atualizado há Xs" andar sem depender de um
  // evento novo chegar.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const filtered = tab === "ALL" ? signals : signals.filter((signal) => STRATEGY_GROUP[signal.strategyId] === tab);
  const lastUpdate = signals.length > 0 ? signals[0].lastEvaluatedAt : null;

  return (
    <div>
      <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            className={`shrink-0 rounded-none px-3 py-2 text-xs font-semibold transition-colors ${
              tab === item.key
                ? "bg-neutral-100 text-surface"
                : "bg-surface/60 text-secondary hover:bg-white/[0.04] hover:text-strong"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {lastUpdate && (
        <p className="mt-2 text-[11px] text-faint">Atualizado {formatAge(lastUpdate, now)}</p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum jogo no funil agora"
            description="O motor analisa as partidas ao vivo o tempo todo. Assim que uma entrar nos critérios, ela aparece aqui."
          />
        ) : (
          filtered.map((signal) => <FunilSignalCard key={signal.id} signal={signal} />)
        )}
      </div>
    </div>
  );
}
