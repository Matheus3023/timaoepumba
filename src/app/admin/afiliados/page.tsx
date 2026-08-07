import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { SmarticoDebugClient } from "@/components/admin/SmarticoDebugClient";

async function saveConfig(formData: FormData) {
  "use server";

  const access = await requireAdminSection("afiliados");
  if (!canWrite(access, "afiliados")) redirect("/admin/afiliados");
  const admin = createAdminSupabaseClient();

  // Look up the current active config server-side instead of trusting a
  // client-submitted hidden "id" field — that field goes stale after the
  // first save (React doesn't refresh an uncontrolled input's defaultValue
  // on re-render), which was silently creating a duplicate "active" row
  // on every subsequent save instead of updating the existing one.
  const { data: existing } = await admin
    .from("affiliate_configurations")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    name: String(formData.get("name") ?? ""),
    domain: String(formData.get("domain") ?? ""),
    registration_url: String(formData.get("registration_url") ?? ""),
    subid_parameter: String(formData.get("subid_parameter") ?? "subid"),
    status: "active",
  };

  if (existing) {
    await admin.from("affiliate_configurations").update(payload).eq("id", existing.id);
  } else {
    await admin.from("affiliate_configurations").insert(payload);
  }

  await logAudit({
    actorId: access.adminId,
    action: "affiliate_config_saved",
    entityType: "affiliate_configuration",
    entityId: existing?.id,
    metadata: { name: payload.name, domain: payload.domain },
  });

  revalidatePath("/admin/afiliados");
}

export default async function AdminAffiliatePage() {
  const access = await requireAdminSection("afiliados");
  const admin = createAdminSupabaseClient();
  const { data: activeConfigs } = await admin
    .from("affiliate_configurations")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const config = activeConfigs?.[0];
  const duplicates = (activeConfigs?.length ?? 0) - 1;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white">Casa parceira</h1>
      <p className="text-sm text-secondary">
        O link de cadastro e gerado dinamicamente com o Lead ID do usuario como subid.
      </p>

      {duplicates > 0 && (
        <div className="card mt-4 border-red-500/30 bg-red-500/5">
          <p className="text-sm font-semibold text-red-300">
            {duplicates} configuracao(oes) duplicada(s) com status ativo encontrada(s).
          </p>
          <p className="mt-1 text-sm text-red-200">
            Isso vinha de um bug no formulario (ja corrigido) que criava um novo registro a cada
            salvamento em vez de atualizar. Editando e salvando abaixo, esta tela passa a usar
            sempre o mais recente — mas para limpar de vez, apague as linhas antigas na tabela{" "}
            <code>affiliate_configurations</code> pelo Supabase (mantenha so uma com status
            &quot;active&quot;).
          </p>
        </div>
      )}

      <form action={saveConfig} className="card mt-4 flex flex-col gap-3">
        <fieldset disabled={!canWrite(access, "afiliados")} className="flex flex-col gap-3 disabled:opacity-60">
          <label className="flex flex-col gap-1 text-sm text-body">
            Nome da casa
            <input name="name" defaultValue={config?.name} required className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            Dominio
            <input name="domain" defaultValue={config?.domain} required className="input" placeholder="casa-parceira.bet.br" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            URL de cadastro
            <input
              name="registration_url"
              defaultValue={config?.registration_url}
              required
              className="input"
              placeholder="https://casa-parceira.bet.br/cadastro"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-body">
            Parametro do identificador
            <input name="subid_parameter" defaultValue={config?.subid_parameter ?? "subid"} required className="input" />
          </label>

          {canWrite(access, "afiliados") && (
            <button type="submit" className="btn-primary mt-2 self-start px-6">
              Salvar
            </button>
          )}
        </fieldset>
      </form>

      {config && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-strong">Configuracao do webhook</h2>
          <p className="mt-2 text-sm text-secondary">
            Configure a casa parceira para enviar postbacks para{" "}
            <code className="text-yellow-300">/api/webhooks/affiliate</code> com os headers:
          </p>
          <dl className="mt-2 flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">X-Webhook-Key</dt>
              <dd className="font-mono text-strong">{config.webhook_key}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">X-Webhook-Signature</dt>
              <dd className="text-strong">HMAC-SHA256(body, segredo)</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-faint">
            O segredo (webhook_secret) fica armazenado no banco e nunca e exibido aqui. Consulte a
            tabela affiliate_configurations diretamente no Supabase para configura-lo na casa
            parceira.
          </p>
        </section>
      )}

      <div className="mt-8 border-t border-surface-elevated pt-6">
        <SmarticoDebugClient canWrite={canWrite(access, "afiliados")} />
      </div>
    </div>
  );
}
