import { loadActiveSignals } from "@/lib/funil/view";
import { getFunilTrackRecord } from "@/lib/funil/trackRecord";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FunilLiveList } from "@/components/funil/FunilLiveList";
import { FunilTrackRecord } from "@/components/funil/FunilTrackRecord";
import { BackButton } from "@/components/ui/BackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { FunilDisclaimer } from "@/components/funil/FunilDisclaimer";

/**
 * FUNIL AO VIVO (PRD sec. 29).
 *
 * A página não calcula nada: o motor roda no servidor em ciclo próprio e
 * grava os sinais; aqui só lemos o resultado já processado. É isso que
 * evita 100 usuários x 30 partidas virarem 3.000 chamadas repetidas à API
 * (PRD sec. 55).
 */
export default async function FunilLivePage() {
  const [{ signals, available }, trackRecord] = await Promise.all([
    loadActiveSignals(),
    getFunilTrackRecord(),
  ]);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await trackServerEvent({ eventName: "FunilLiveViewed", userId: user?.id, properties: { signals: signals.length } });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <BackButton fallbackHref="/analises" className="mb-3" />

      <h1 className="text-xl font-bold text-white">🔥 Funil ao vivo</h1>
      <p className="mt-1 text-sm text-secondary">
        Análise automática das partidas ao vivo. Cada entrada mostra os critérios que passaram e pode ser
        conferida número por número.
      </p>

      <FunilTrackRecord record={trackRecord} />

      {!available ? (
        <ErrorState
          className="mt-4"
          title="Motor indisponível"
          description="Não consegui ler os sinais agora. Tente novamente em instantes."
        />
      ) : (
        <FunilLiveList signals={signals} />
      )}

      <FunilDisclaimer />
    </div>
  );
}
