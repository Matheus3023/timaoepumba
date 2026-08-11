import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/tracking/events";
import { loadSignalDetail } from "@/lib/funil/view";
import { STRATEGY_LABEL } from "@/lib/funil/defaults";
import { SIGNAL_STATE_LABEL, formatMetric } from "@/lib/funil/presentation";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { BackButton } from "@/components/ui/BackButton";
import { FunilDisclaimer } from "@/components/funil/FunilDisclaimer";
import type { RuleResult } from "@/lib/funil/types";

const RULE_ICON: Record<RuleResult["status"], string> = {
  pass: "✅",
  fail: "❌",
  unavailable: "⚠️",
  not_evaluated: "⏳",
};

const RULE_VERDICT: Record<RuleResult["status"], string> = {
  pass: "APROVADO",
  fail: "NAO ATENDIDO",
  unavailable: "SEM DADO",
  not_evaluated: "NAO AVALIADO",
};

const RESULT_LABEL: Record<string, string> = {
  PENDING: "Aguardando resultado",
  GREEN: "GREEN",
  RED: "RED",
  PUSH: "DEVOLVIDO (PUSH)",
  VOID: "ANULADO",
};

function formatRuleValue(value: RuleResult["value"]): string {
  if (value === null || value === undefined) return "—";
  return typeof value === "number" ? formatMetric(value) : String(value);
}

/**
 * "VER ANALISE" (PRD secs. 31 e 32).
 *
 * O aplicativo nunca solta um sinal como caixa-preta: aqui aparece cada
 * criterio com o valor real medido, o minimo exigido e o veredito, mais a
 * progressao do funil. Tudo vem gravado do momento da avaliacao — nada e
 * recalculado nesta tela.
 */
export default async function FunilSignalDetailPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const signal = await loadSignalDetail(signalId);
  if (!signal) notFound();

  const admin = createAdminSupabaseClient();
  const [{ data: result }, { data: snapshots }] = await Promise.all([
    admin.from("signal_results").select("*").eq("signal_id", signalId).maybeSingle(),
    admin
      .from("signal_snapshots")
      .select("state, minute, created_at")
      .eq("signal_id", signalId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await trackServerEvent({
    eventName: "FunilSignalAnalysisViewed",
    userId: user?.id,
    properties: { signal_id: signalId, strategy_id: signal.strategyId },
  });

  const passed = signal.rules.filter((rule) => rule.status === "pass").length;
  const total = signal.rules.length;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <BackButton fallbackHref="/analises/funil" className="mb-3" />

      <div className="card-glow">
        <p className="text-sm font-bold text-white">{STRATEGY_LABEL[signal.strategyId]}</p>
        <p className="text-xs text-muted">{signal.competition}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <TeamAvatar name={signal.homeTeamName} logoUrl={signal.homeTeamLogo} size={44} />
            <p className="text-xs font-semibold leading-tight text-strong">{signal.homeTeamName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1 px-2">
            <p className="text-2xl font-bold tabular-nums text-white">
              {signal.scoreHome ?? 0}
              <span className="mx-1 text-faint">-</span>
              {signal.scoreAway ?? 0}
            </p>
            <span className="badge bg-surface-highlighted/40 text-[10px] text-body">
              {signal.minute !== null ? `${signal.minute}'` : "—"}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <TeamAvatar name={signal.awayTeamName} logoUrl={signal.awayTeamLogo} size={44} />
            <p className="text-xs font-semibold leading-tight text-strong">{signal.awayTeamName}</p>
          </div>
        </div>

        {signal.entryLineLabel && (
          <div className="mt-3 rounded-none border border-white/[0.06] bg-surface/60 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted">Entrada analisada</p>
            <p className="mt-0.5 text-sm font-bold text-white">{signal.entryLineLabel}</p>
            <p className="mt-1 text-[11px] text-secondary">
              {signal.entryOdd !== null ? `Odd ${signal.entryOdd.toFixed(2)}` : "Consulte a odd disponível."}
            </p>
          </div>
        )}
      </div>

      {/* Progressao do funil (PRD sec. 32) */}
      <section className="card mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-strong">Criterios do funil</h2>
          <p className="text-xs font-semibold tabular-nums text-secondary">
            {passed}/{total} criterios
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted">{SIGNAL_STATE_LABEL[signal.state]}</p>

        <div className="mt-3 flex flex-col gap-2">
          {signal.rules.map((rule) => (
            <div key={rule.key} className="border-t border-white/5 pt-2 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-strong">{rule.label}</p>
                <p className="text-xs text-secondary">
                  {RULE_ICON[rule.status]} {RULE_VERDICT[rule.status]}
                </p>
              </div>
              <p className="mt-0.5 flex items-baseline gap-2 text-xs text-muted">
                <span className="text-base font-bold tabular-nums text-white">{formatRuleValue(rule.value)}</span>
                {rule.threshold !== null && rule.threshold !== undefined && (
                  <span>
                    minimo:{" "}
                    {typeof rule.threshold === "number" ? formatMetric(rule.threshold) : rule.threshold}
                  </span>
                )}
              </p>
              {rule.detail && <p className="mt-0.5 text-[11px] text-faint">{rule.detail}</p>}
            </div>
          ))}
        </div>
      </section>

      {signal.tpScore !== null && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-strong">Forca do sinal</h2>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {signal.tpScore}
            <span className="text-base text-faint">/100</span>
          </p>
          {/* O PRD sec. 24 e explicito: isto nao pode ser apresentado como
              chance de green, e nunca substitui os criterios acima. */}
          <p className="mt-1 text-xs text-muted">
            Nota de forca do sinal, calculada separadamente das regras do funil. Nao e probabilidade de
            acerto.
          </p>
        </section>
      )}

      {signal.warnings.length > 0 && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-strong">Observacoes sobre os dados</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {signal.warnings.map((warning) => (
              <li key={warning} className="text-xs text-muted">
                • {warning}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-strong">Resultado</h2>
          <p className="mt-1 text-sm font-bold text-white">{RESULT_LABEL[result.result] ?? result.result}</p>
          {result.resolving_event && <p className="mt-0.5 text-xs text-muted">{result.resolving_event}</p>}
        </section>
      )}

      {snapshots && snapshots.length > 0 && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-strong">Historico do sinal</h2>
          <div className="mt-2 flex flex-col gap-1">
            {snapshots.map((snapshot) => (
              <p key={snapshot.created_at} className="text-xs text-muted">
                <span className="tabular-nums text-secondary">
                  {snapshot.minute !== null ? `${snapshot.minute}'` : "—"}
                </span>{" "}
                {SIGNAL_STATE_LABEL[snapshot.state as keyof typeof SIGNAL_STATE_LABEL] ?? snapshot.state}
              </p>
            ))}
          </div>
        </section>
      )}

      <p className="mt-4 text-center text-[11px] text-faint">
        Estrategia {STRATEGY_LABEL[signal.strategyId]} v{signal.strategyVersion} • qualidade dos dados:{" "}
        {signal.dataQuality ?? "—"}
      </p>

      <FunilDisclaimer />
    </div>
  );
}
