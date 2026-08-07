import { loadActiveSignals } from "@/lib/funil/view";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FunilLiveList } from "@/components/funil/FunilLiveList";
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
  const { signals, available } = await loadActiveSignals();

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
        Analise automatica das partidas ao vivo. Cada entrada mostra os criterios que passaram e pode ser
        conferida numero por numero.
      </p>

      {!available ? (
        <ErrorState
          className="mt-4"
          title="Motor indisponivel"
          description="Nao consegui ler os sinais agora. Tente novamente em instantes."
        />
      ) : (
        <FunilLiveList signals={signals} />
      )}

      <FunilDisclaimer />
    </div>
  );
}
