import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SignalResultValue } from "@/lib/funil/types";

/**
 * Retrospecto do Funil — a assertividade que a galera precisa ver antes de
 * confiar numa entrada.
 *
 * Não inventa nada: lê os resultados já apurados pelo motor (signal_results)
 * e agrega. Taxa de acerto = GREEN / (GREEN + RED). PUSH devolve a aposta e
 * VOID nem valeu, então nenhum dos dois entra na conta da taxa (contá-los
 * afundaria ou inflaria o número sem representar acerto/erro) — mas aparecem
 * à parte para o número ser honesto. PENDING é sinal ainda em aberto.
 */

export interface FunilTrackRecord {
  green: number;
  red: number;
  push: number;
  void: number;
  pending: number;
  /** GREEN + RED — o denominador da taxa. */
  decided: number;
  /** GREEN / decided em % inteiro, ou null se ainda não há entrada decidida. */
  hitRate: number | null;
  /** Últimos resultados decididos, do mais recente para o mais antigo. */
  recentForm: ("GREEN" | "RED" | "PUSH")[];
}

const VAZIO: FunilTrackRecord = {
  green: 0,
  red: 0,
  push: 0,
  void: 0,
  pending: 0,
  decided: 0,
  hitRate: null,
  recentForm: [],
};

export async function getFunilTrackRecord(recentLimit = 15): Promise<FunilTrackRecord> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("signal_results")
    .select("result, resolved_at")
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .limit(2000);

  if (error || !data) return VAZIO;

  const contagem: Record<SignalResultValue, number> = { GREEN: 0, RED: 0, PUSH: 0, VOID: 0, PENDING: 0 };
  const recentForm: ("GREEN" | "RED" | "PUSH")[] = [];

  for (const row of data) {
    const r = row.result as SignalResultValue;
    if (r in contagem) contagem[r] += 1;
    // Retrospecto recente: só o que de fato saiu (green/red/push), na ordem
    // que a query já trouxe (mais novo primeiro).
    if (recentForm.length < recentLimit && (r === "GREEN" || r === "RED" || r === "PUSH")) {
      recentForm.push(r);
    }
  }

  const decided = contagem.GREEN + contagem.RED;
  const hitRate = decided > 0 ? Math.round((contagem.GREEN / decided) * 100) : null;

  return {
    green: contagem.GREEN,
    red: contagem.RED,
    push: contagem.PUSH,
    void: contagem.VOID,
    pending: contagem.PENDING,
    decided,
    hitRate,
    recentForm,
  };
}
