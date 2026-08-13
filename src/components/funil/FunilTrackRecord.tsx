import type { FunilTrackRecord } from "@/lib/funil/trackRecord";

/**
 * Retrospecto do Funil — o cartão de assertividade no topo da tela.
 *
 * É a prova social do app: sem um número de acerto na cara, ninguém confia
 * numa entrada. Mostra a taxa em destaque, o placar green/red, o retrospecto
 * recente em bolinhas e a amostra (pra não parecer número inventado).
 *
 * Componente burro: recebe o retrospecto já agregado (getFunilTrackRecord).
 */
export function FunilTrackRecord({ record }: { record: FunilTrackRecord }) {
  // Sem entrada decidida ainda: não mostra taxa fake, explica que está começando.
  if (record.decided === 0) {
    return (
      <div className="card mt-4">
        <p className="text-sm font-semibold text-strong">Retrospecto do Funil</p>
        <p className="mt-1 text-xs text-secondary">
          As entradas começam a ser apuradas conforme os jogos terminam. Em breve a taxa de acerto
          aparece aqui.
        </p>
      </div>
    );
  }

  const dotStyle = (r: "GREEN" | "RED" | "PUSH") =>
    r === "GREEN" ? "bg-emerald-400" : r === "RED" ? "bg-red-400" : "bg-slate-400";

  return (
    <div className="card-glow mt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">Assertividade do Funil</p>
          <p className="mt-0.5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tabular-nums text-emerald-400">{record.hitRate}%</span>
            <span className="text-xs font-semibold text-secondary">de acerto</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums text-white">
            <span className="text-emerald-400">{record.green}</span>
            <span className="mx-1 text-faint">-</span>
            <span className="text-red-400">{record.red}</span>
          </p>
          <p className="text-[10px] text-muted">green · red</p>
          <p className="mt-0.5 text-[10px] tabular-nums text-faint">{record.decided} entradas decididas</p>
        </div>
      </div>

      {record.recentForm.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Últimas entradas</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {record.recentForm.map((r, i) => (
              <span
                key={i}
                className={`inline-block h-2.5 w-2.5 rounded-full ${dotStyle(r)}`}
                title={r === "GREEN" ? "Green" : r === "RED" ? "Red" : "Push (devolvido)"}
              />
            ))}
          </div>
        </div>
      )}

      {(record.push > 0 || record.pending > 0) && (
        <p className="mt-3 border-t border-white/5 pt-2 text-[11px] text-muted">
          {record.push > 0 && `${record.push} push (aposta devolvida)`}
          {record.push > 0 && record.pending > 0 && " · "}
          {record.pending > 0 && `${record.pending} em aberto`}
          {". Push e devolução não entram na taxa."}
        </p>
      )}
    </div>
  );
}
