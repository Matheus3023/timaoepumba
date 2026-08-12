import { loadActiveSignals, loadFunilHistory } from "@/lib/funil/view";
import { trackServerEvent } from "@/lib/tracking/events";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FunilLiveList } from "@/components/funil/FunilLiveList";
import { FunilHistoryPanel } from "@/components/funil/FunilHistoryPanel";
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
  /* Em paralelo: o histórico não depende dos sinais ativos, e encadear as
     duas leituras só somaria latência na abertura da tela. */
  const [{ signals, available }, history] = await Promise.all([
    loadActiveSignals(),
    loadFunilHistory(),
  ]);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await trackServerEvent({ eventName: "FunilLiveViewed", userId: user?.id, properties: { signals: signals.length } });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <BackButton fallbackHref="/analises" className="mb-3" />

      <p className="hud-label">Motor Funil</p>
      {/* O 🔥 saiu: emoji decorativo é item da checagem anti-IA do DESIGN.md,
          e o condensado maiúsculo já carrega a energia sozinho. */}
      <h1 className="mt-1.5 text-[1.375rem] uppercase leading-none tracking-[0.01em] text-strong">
        Funil ao vivo
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Análise automática das partidas ao vivo. Cada entrada mostra os critérios que passaram e pode ser
        conferida número por número.
      </p>

      {!available ? (
        <ErrorState
          className="mt-4"
          title="Motor indisponível"
          description="Não consegui ler os sinais agora. Tente novamente em instantes."
        />
      ) : (
        <FunilLiveList signals={signals} />
      )}

      <div className="mt-8">
        <FunilHistoryPanel history={history} />
      </div>

      <FunilDisclaimer />
    </div>
  );
}
