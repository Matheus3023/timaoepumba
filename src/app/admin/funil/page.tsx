import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { DEFAULT_SCORE_CONTEXTS, SCORE_CONTEXT_LABEL } from "@/lib/funil/scoreContext";
import { STRATEGY_IDS, STRATEGY_LABEL } from "@/lib/funil/defaults";
import { FUNIL_DIAGNOSTICS_KEY, type FunilDiagnostics } from "@/lib/funil/tick";
import type { ScoreContext, StrategyParams } from "@/lib/funil/types";
import type { StrategyConfigRow, StrategyPerformanceRow } from "@/types/database";

async function requireFunilWrite() {
  const access = await requireAdminSection("funil");
  if (!canWrite(access, "funil")) redirect("/admin/funil");
  return access;
}

/**
 * Campos numéricos configuráveis por estratégia (PRD sec. 37). Nem toda
 * estratégia usa todos: Gol HT tem BO e RM, Gol FT tem chutes no alvo, e as
 * de canto têm contexto de placar. Só é renderizado o que a estratégia
 * realmente lê, para o painel não sugerir que existe limiar onde não há.
 */
const PARAM_FIELDS: { key: keyof StrategyParams; label: string; step: string }[] = [
  { key: "min_minute", label: "Minuto inicial", step: "1" },
  { key: "max_minute", label: "Minuto final", step: "1" },
  { key: "min_appm", label: "APPM mínimo", step: "0.01" },
  { key: "min_cg_dominant", label: "CG mínimo (dominante)", step: "1" },
  { key: "min_cg_total", label: "CG mínimo (somado)", step: "1" },
  { key: "min_shots_on_target_total", label: "Chutes no alvo (soma) >", step: "1" },
  { key: "min_bo", label: "BO mínimo", step: "0.01" },
  { key: "min_rm", label: "RM mínimo", step: "1" },
  { key: "min_odd", label: "Odd de referência", step: "0.01" },
  { key: "pre_signal_lead_minutes", label: "Antecedência do pré-sinal (min)", step: "1" },
  { key: "line_offset", label: "Deslocamento da linha", step: "0.5" },
];

/**
 * Sobe a versão: 1.0 → 1.1. Muda só o "minor" porque toda alteração aqui é
 * ajuste de limiar dentro da mesma estratégia.
 */
function nextVersion(current: string): string {
  const [major, minor] = current.split(".");
  const nextMinor = Number(minor ?? 0) + 1;
  return `${major || "1"}.${Number.isFinite(nextMinor) ? nextMinor : 1}`;
}

/**
 * Alterar um limiar cria uma VERSÃO NOVA em vez de editar a atual
 * (PRD sec. 38). Sem isso, os sinais já gravados passariam a ser lidos com
 * limiares diferentes dos que realmente os geraram, e a comparação de
 * performance entre versões perderia o sentido.
 */
async function saveParams(strategyId: string, formData: FormData) {
  "use server";
  const access = await requireFunilWrite();
  const admin = createAdminSupabaseClient();

  const { data: current } = await admin
    .from("strategy_configs")
    .select("*")
    .eq("strategy_id", strategyId)
    .eq("is_current", true)
    .maybeSingle();

  if (!current) redirect("/admin/funil");

  const params: Record<string, unknown> = { ...((current.params ?? {}) as Record<string, unknown>) };
  for (const field of PARAM_FIELDS) {
    const raw = formData.get(field.key);
    if (raw === null) continue;
    const text = String(raw).trim();
    // Campo em branco significa "sem limiar" — o critério passa a
    // not_evaluated em vez de virar zero, que reprovaria tudo.
    params[field.key] = text === "" ? null : Number(text);
  }

  const contexts = formData.getAll("score_contexts").map(String) as ScoreContext[];
  if (formData.get("has_score_contexts") === "1") {
    params.score_contexts = contexts.length > 0 ? contexts : DEFAULT_SCORE_CONTEXTS;
  }

  const blockOnUnavailable: string[] = [];
  if (formData.get("block_bo") === "on") blockOnUnavailable.push("bo");
  if (formData.get("block_rm") === "on") blockOnUnavailable.push("rm");
  params.block_on_unavailable = blockOnUnavailable;

  const version = nextVersion(current.version);
  await admin.from("strategy_configs").update({ is_current: false }).eq("id", current.id);
  await admin.from("strategy_configs").insert({
    strategy_id: strategyId,
    version,
    is_current: true,
    enabled: current.enabled,
    shadow_mode: current.shadow_mode,
    notification_enabled: current.notification_enabled,
    pre_signal_enabled: current.pre_signal_enabled,
    cooldown_seconds: current.cooldown_seconds,
    params,
  });

  await logAudit({
    actorId: access.adminId,
    action: "funil_strategy_version_created",
    entityType: "strategy_config",
    entityId: strategyId,
    metadata: { from: current.version, to: version },
  });
  revalidatePath("/admin/funil");
}

/**
 * Liga/desliga não muda regra, então NÃO cria versão nova — a comparação
 * histórica continua válida.
 */
async function toggleFlag(strategyId: string, flag: string) {
  "use server";
  const access = await requireFunilWrite();
  const admin = createAdminSupabaseClient();

  const { data: current } = await admin
    .from("strategy_configs")
    .select("id, enabled, shadow_mode, notification_enabled, pre_signal_enabled")
    .eq("strategy_id", strategyId)
    .eq("is_current", true)
    .maybeSingle();
  if (!current) redirect("/admin/funil");

  const column = flag as "enabled" | "shadow_mode" | "notification_enabled" | "pre_signal_enabled";
  const next = !current[column];

  // Objeto montado campo a campo em vez de chave computada: `{ [column]: next }`
  // colapsa para um índice genérico e o tipo da tabela deixa de ser checado.
  const patch: Partial<StrategyConfigRow> =
    column === "enabled"
      ? { enabled: next }
      : column === "shadow_mode"
        ? { shadow_mode: next }
        : column === "notification_enabled"
          ? { notification_enabled: next }
          : { pre_signal_enabled: next };

  await admin.from("strategy_configs").update(patch).eq("id", current.id);

  await logAudit({
    actorId: access.adminId,
    action: "funil_strategy_flag_toggled",
    entityType: "strategy_config",
    entityId: strategyId,
    metadata: { flag: column, value: next },
  });
  revalidatePath("/admin/funil");
}

async function saveCooldown(strategyId: string, formData: FormData) {
  "use server";
  const access = await requireFunilWrite();
  const admin = createAdminSupabaseClient();

  const seconds = Number(formData.get("cooldown_seconds") ?? 180);
  await admin
    .from("strategy_configs")
    .update({ cooldown_seconds: Number.isFinite(seconds) ? Math.max(30, Math.round(seconds)) : 180 })
    .eq("strategy_id", strategyId)
    .eq("is_current", true);

  await logAudit({
    actorId: access.adminId,
    action: "funil_strategy_cooldown_updated",
    entityType: "strategy_config",
    entityId: strategyId,
  });
  revalidatePath("/admin/funil");
}

export default async function AdminFunilPage() {
  const access = await requireAdminSection("funil");
  const writable = canWrite(access, "funil");
  const admin = createAdminSupabaseClient();

  const [{ data: configs, error }, { data: diagnosticsRow }, { data: performance }] = await Promise.all([
    admin.from("strategy_configs").select("*").eq("is_current", true),
    admin.from("system_settings").select("value, updated_at").eq("key", FUNIL_DIAGNOSTICS_KEY).maybeSingle(),
    admin.from("strategy_performance").select("*").order("signals", { ascending: false }).limit(40),
  ]);

  const diagnostics = (diagnosticsRow?.value ?? null) as FunilDiagnostics | null;
  const byStrategy = new Map((configs ?? []).map((row) => [row.strategy_id, row]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-white">Motor Funil</h1>
      <p className="mt-1 text-sm text-secondary">
        O motor roda no servidor a cada ciclo, analisa as partidas ao vivo e grava os sinais. Em shadow
        mode ele registra tudo sem mostrar nada ao usuario e sem enviar push.
      </p>
      {!writable && <p className="mt-1 text-xs text-muted">Modo somente leitura para o seu perfil.</p>}

      {error && (
        <div className="card mt-4 border-primary/30 bg-primary/5">
          <p className="text-sm font-semibold text-yellow-300">Motor inativo</p>
          <p className="mt-1 text-sm text-body">
            Nao consegui ler <span className="font-mono">strategy_configs</span>. O motor nao roda sem essa
            tabela — execute a migration <span className="font-mono">0010_funil_engine.sql</span> no SQL
            Editor do Supabase.
          </p>
          <p className="mt-2 font-mono text-xs text-muted">{error.message}</p>
        </div>
      )}

      <FieldDiagnostics diagnostics={diagnostics} updatedAt={diagnosticsRow?.updated_at ?? null} />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-strong">Estrategias</h2>
        <p className="mb-2 text-xs text-muted">
          Alterar um limiar cria uma versao nova, para dar para comparar depois qual versao performou
          melhor. Ligar/desligar nao cria versao.
        </p>

        <div className="flex flex-col gap-3">
          {STRATEGY_IDS.map((strategyId) => {
            const config = byStrategy.get(strategyId);
            if (!config) {
              return (
                <div key={strategyId} className="card">
                  <p className="font-semibold text-white">{STRATEGY_LABEL[strategyId]}</p>
                  <p className="mt-1 text-xs text-muted">Ainda nao configurada no banco.</p>
                </div>
              );
            }
            return <StrategyCard key={strategyId} config={config} writable={writable} />;
          })}
        </div>
      </section>

      <PerformanceTable rows={performance ?? []} />
    </div>
  );
}

function FieldDiagnostics({
  diagnostics,
  updatedAt,
}: {
  diagnostics: FunilDiagnostics | null;
  updatedAt: string | null;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-strong">Diagnostico de campos</h2>
      <p className="mb-2 text-xs text-muted">
        O que o provedor mandou no ultimo ciclo. Campo que fica vazio nunca vira zero — a estrategia
        simplesmente nao valida. Rotulo desconhecido aqui e ajuste de dicionario, nao erro de calculo.
      </p>

      {!diagnostics ? (
        <p className="card text-sm text-muted">
          Nenhum ciclo executado ainda. Configure o agendador para chamar{" "}
          <span className="font-mono">POST /api/funil/tick</span> com o header{" "}
          <span className="font-mono">X-Automation-Secret</span>.
        </p>
      ) : (
        <div className="card">
          <p className="text-xs text-muted">
            Ultimo ciclo: {updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : "—"} •{" "}
            {diagnostics.fixturesEvaluated} partida(s) consultada(s)
          </p>

          {diagnostics.unmappedLabels.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-yellow-300">Rotulos nao reconhecidos</p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {diagnostics.unmappedLabels.map((label) => (
                  <span key={label} className="badge bg-surface-elevated font-mono text-[10px] text-secondary">
                    {label}
                  </span>
                ))}
              </p>
            </div>
          )}

          {diagnostics.competitions.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {diagnostics.competitions.map((item) => (
                <div key={`${item.competition}-${item.fixture}`} className="border-t border-white/5 pt-2">
                  <p className="text-xs font-semibold text-body">{item.competition}</p>
                  <p className="text-xs text-muted">{item.fixture}</p>
                  {item.missingFields.length === 0 ? (
                    <p className="mt-1 text-xs text-emerald-300">Todos os campos disponiveis.</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">
                      Sem dado: <span className="font-mono">{item.missingFields.join(", ")}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {diagnostics.errors.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-2">
              <p className="text-xs font-semibold text-red-300">Erros no ciclo</p>
              {diagnostics.errors.map((message) => (
                <p key={message} className="mt-1 font-mono text-[11px] text-muted">
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StrategyCard({ config, writable }: { config: StrategyConfigRow; writable: boolean }) {
  const params = (config.params ?? {}) as unknown as StrategyParams;
  const strategyId = config.strategy_id;
  const isCorner = strategyId.includes("CORNER");
  const blockOnUnavailable = params.block_on_unavailable ?? [];

  const visibleFields = PARAM_FIELDS.filter((field) => {
    if (field.key === "line_offset") return isCorner;
    if (field.key === "min_bo" || field.key === "min_rm") return strategyId === "FUNIL_GOAL_HT";
    if (field.key === "min_cg_total" || field.key === "min_shots_on_target_total") {
      return strategyId === "FUNIL_GOAL_FT";
    }
    if (field.key === "min_cg_dominant") return strategyId !== "FUNIL_GOAL_FT";
    return true;
  });

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white">{STRATEGY_LABEL[strategyId as keyof typeof STRATEGY_LABEL]}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="badge bg-surface-elevated font-mono text-[10px] text-secondary">
              v{config.version}
            </span>
            <span
              className={`badge text-[10px] ${
                config.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-surface-highlighted/50 text-muted"
              }`}
            >
              {config.enabled ? "Ativa" : "Desligada"}
            </span>
            {config.shadow_mode && (
              <span className="badge bg-primary/15 text-[10px] text-yellow-300">Shadow — invisivel ao usuario</span>
            )}
          </p>
        </div>

        {writable && (
          <div className="flex flex-wrap gap-1.5">
            <form action={toggleFlag.bind(null, strategyId, "enabled")}>
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                {config.enabled ? "Desligar" : "Ligar"}
              </button>
            </form>
            <form action={toggleFlag.bind(null, strategyId, "shadow_mode")}>
              <button
                type="submit"
                className={`btn-secondary px-3 py-1.5 text-xs ${config.shadow_mode ? "text-emerald-300" : "text-yellow-300"}`}
              >
                {config.shadow_mode ? "Liberar aos usuarios" : "Voltar ao shadow"}
              </button>
            </form>
          </div>
        )}
      </div>

      {writable && (
        <>
          <form action={saveParams.bind(null, strategyId)} className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {visibleFields.map((field) => (
                <label key={field.key} className="text-xs text-muted">
                  {field.label}
                  <input
                    type="number"
                    step={field.step}
                    name={field.key}
                    defaultValue={
                      params[field.key] === null || params[field.key] === undefined
                        ? ""
                        : String(params[field.key])
                    }
                    className="input mt-1 w-full py-2 text-sm"
                  />
                </label>
              ))}
            </div>

            {isCorner && (
              <div className="mt-3">
                <input type="hidden" name="has_score_contexts" value="1" />
                <p className="text-xs text-muted">Contextos de placar aceitos</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-body">
                  {(Object.keys(SCORE_CONTEXT_LABEL) as ScoreContext[]).map((context) => (
                    <label key={context} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        name="score_contexts"
                        value={context}
                        defaultChecked={(params.score_contexts ?? DEFAULT_SCORE_CONTEXTS).includes(context)}
                      />
                      {SCORE_CONTEXT_LABEL[context]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {strategyId === "FUNIL_GOAL_HT" && (
              <div className="mt-3">
                <p className="text-xs text-muted">
                  Bloquear quando o dado faltar. Por padrao um criterio sem dado fica sinalizado e nao
                  reprova — marque para exigir o dado.
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-body">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="block_bo" defaultChecked={blockOnUnavailable.includes("bo")} />
                    Exigir BO
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="block_rm" defaultChecked={blockOnUnavailable.includes("rm")} />
                    Exigir RM
                  </label>
                </div>
              </div>
            )}

            <button type="submit" className="btn-secondary mt-3 px-3 py-1.5 text-xs">
              Salvar como v{nextVersion(config.version)}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-white/5 pt-3">
            <form action={saveCooldown.bind(null, strategyId)} className="flex items-end gap-2">
              <label className="text-xs text-muted">
                Cooldown (s)
                <input
                  type="number"
                  name="cooldown_seconds"
                  min={30}
                  defaultValue={config.cooldown_seconds}
                  className="input mt-1 w-24 py-2 text-sm"
                />
              </label>
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                Salvar
              </button>
            </form>

            <form action={toggleFlag.bind(null, strategyId, "notification_enabled")}>
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                Push: {config.notification_enabled ? "ligado" : "desligado"}
              </button>
            </form>
            <form action={toggleFlag.bind(null, strategyId, "pre_signal_enabled")}>
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                Pre-sinal: {config.pre_signal_enabled ? "ligado" : "desligado"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function PerformanceTable({ rows }: { rows: StrategyPerformanceRow[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-strong">Performance observada</h2>
      <p className="mb-2 text-xs text-muted">
        Historico dos sinais ja apurados. Taxa observada e o que aconteceu no passado, nao previsao nem
        promessa de resultado futuro. Devolucoes (PUSH) e sinais anulados ficam fora do calculo.
      </p>

      {rows.length === 0 ? (
        <p className="card text-sm text-muted">Nenhum sinal apurado ainda.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 pr-3 font-medium">Estrategia</th>
                <th className="pb-2 pr-3 font-medium">Versao</th>
                <th className="pb-2 pr-3 font-medium">Liga</th>
                <th className="pb-2 pr-3 font-medium">Minuto</th>
                <th className="pb-2 pr-3 font-medium">Score</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Sinais</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">G</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">R</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">P</th>
                <th className="pb-2 font-medium tabular-nums">Taxa</th>
              </tr>
            </thead>
            <tbody className="text-body">
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-white/5">
                  <td className="py-2 pr-3">
                    {STRATEGY_LABEL[row.strategy_id as keyof typeof STRATEGY_LABEL] ?? row.strategy_id}
                    {row.shadow && <span className="ml-1 text-[10px] text-yellow-300">shadow</span>}
                  </td>
                  <td className="py-2 pr-3 font-mono">v{row.strategy_version}</td>
                  <td className="py-2 pr-3">{row.league_name ?? "—"}</td>
                  <td className="py-2 pr-3">{row.minute_band}</td>
                  <td className="py-2 pr-3">{row.tp_score_band}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.signals}</td>
                  <td className="py-2 pr-3 tabular-nums text-emerald-300">{row.greens}</td>
                  <td className="py-2 pr-3 tabular-nums text-red-300">{row.reds}</td>
                  <td className="py-2 pr-3 tabular-nums text-muted">{row.pushes}</td>
                  <td className="py-2 tabular-nums">
                    {row.observed_rate === null ? "—" : `${row.observed_rate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
