import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { DEFAULT_ONBOARDING_CONFIG, type OnboardingConfig } from "@/lib/onboarding/config";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel } from "@/components/admin/Panel";
import { Stat, StatStrip } from "@/components/admin/StatStrip";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { formatPercent } from "@/components/admin/format";

async function saveConfig(formData: FormData) {
  "use server";

  const access = await requireAdminSection("onboarding");
  if (!canWrite(access, "onboarding")) redirect("/admin/onboarding");
  const admin = createAdminSupabaseClient();
  const { data: row } = await admin.from("system_settings").select("value").eq("key", "onboarding_config").maybeSingle();
  const current: OnboardingConfig = { ...DEFAULT_ONBOARDING_CONFIG, ...((row?.value as Partial<OnboardingConfig>) ?? {}) };

  const updated: OnboardingConfig = {
    ...current,
    welcome_title: String(formData.get("welcome_title") ?? current.welcome_title),
    welcome_text: String(formData.get("welcome_text") ?? current.welcome_text),
    notifications_title: String(formData.get("notifications_title") ?? current.notifications_title),
    notifications_text: String(formData.get("notifications_text") ?? current.notifications_text),
    install_step_enabled: formData.get("install_step_enabled") === "on",
    notifications_step_enabled: formData.get("notifications_step_enabled") === "on",
    onboarding_required: formData.get("onboarding_required") === "on",
  };

  await admin.from("system_settings").upsert({ key: "onboarding_config", value: updated });
  await logAudit({
    actorId: access.adminId,
    action: "onboarding_config_updated",
    entityType: "system_settings",
    entityId: "onboarding_config",
  });
  revalidatePath("/admin/onboarding");
}

export default async function AdminOnboardingPage() {
  const access = await requireAdminSection("onboarding");
  const writable = canWrite(access, "onboarding");
  const admin = createAdminSupabaseClient();

  const [{ data: row }, { data: profiles }] = await Promise.all([
    admin.from("system_settings").select("value").eq("key", "onboarding_config").maybeSingle(),
    admin
      .from("user_profiles")
      .select(
        "pwa_install_status, pwa_install_clicked_at, notification_permission, notification_permission_requested_at, onboarding_completed"
      ),
  ]);

  const config: OnboardingConfig = { ...DEFAULT_ONBOARDING_CONFIG, ...((row?.value as Partial<OnboardingConfig>) ?? {}) };

  const total = profiles?.length ?? 0;
  const installClicked = profiles?.filter((profile) => profile.pwa_install_clicked_at).length ?? 0;
  const installed = profiles?.filter((profile) => profile.pwa_install_status === "installed").length ?? 0;
  const notifRequested = profiles?.filter((profile) => profile.notification_permission_requested_at).length ?? 0;
  const notifGranted = profiles?.filter((profile) => profile.notification_permission === "granted").length ?? 0;
  const completed = profiles?.filter((profile) => profile.onboarding_completed).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Operação"
        title="Onboarding e instalação"
        description="Onde as pessoas param antes de virar usuário instalado e notificável."
        actions={!writable ? <span className="badge bg-surface-elevated text-muted">Somente leitura</span> : undefined}
      />

      <StatStrip columns={3}>
        <Stat label="Contas com perfil" value={total} />
        <Stat label="App instalado" value={installed} hint={formatPercent(installed, total, 1)} />
        <Stat label="Notificações autorizadas" value={notifGranted} hint={formatPercent(notifGranted, total, 1)} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Instalação do aplicativo" description="Quantos chegaram até o app na tela de início.">
          <FunnelChart
            steps={[
              { label: "Contas criadas", value: total },
              { label: "Clicaram em instalar", value: installClicked },
              { label: "Instalação concluída", value: installed },
            ]}
          />
        </Panel>

        <Panel title="Permissão de notificação" description="Sem permissão não há push, e sem push não há retorno.">
          <FunnelChart
            accent="away"
            steps={[
              { label: "Contas criadas", value: total },
              { label: "Permissão solicitada", value: notifRequested },
              { label: "Permissão autorizada", value: notifGranted },
            ]}
          />
        </Panel>
      </div>

      <Panel
        title="Onboarding concluído"
        description={`${completed} de ${total} perfis concluíram o fluxo (${formatPercent(completed, total, 1)}).`}
      >
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full bg-chart-home"
            style={{ width: `${total > 0 ? Math.max((completed / total) * 100, 1.5) : 0}%` }}
          />
        </div>
      </Panel>

      <Panel title="Textos e etapas" description="O que a pessoa lê nas duas primeiras telas do aplicativo.">
        <form action={saveConfig} className="flex flex-col gap-3">
          <fieldset disabled={!writable} className="flex flex-col gap-3 disabled:opacity-60">
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-body">
                Título (boas-vindas)
                <input name="welcome_title" defaultValue={config.welcome_title} className="input text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-body">
                Título (notificações)
                <input name="notifications_title" defaultValue={config.notifications_title} className="input text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-body">
                Texto (boas-vindas)
                <textarea name="welcome_text" defaultValue={config.welcome_text} rows={3} className="input text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-body">
                Texto (notificações)
                <textarea
                  name="notifications_text"
                  defaultValue={config.notifications_text}
                  rows={3}
                  className="input text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.06] pt-3 text-sm text-body">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="install_step_enabled"
                  defaultChecked={config.install_step_enabled}
                  className="h-4 w-4 accent-primary"
                />
                Etapa de instalação ativa
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="notifications_step_enabled"
                  defaultChecked={config.notifications_step_enabled}
                  className="h-4 w-4 accent-primary"
                />
                Etapa de notificações ativa
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="onboarding_required"
                  defaultChecked={config.onboarding_required}
                  className="h-4 w-4 accent-primary"
                />
                Onboarding obrigatório
              </label>
            </div>

            {writable && (
              <button type="submit" className="btn-primary mt-1 self-start px-6 py-2.5 text-sm">
                Salvar
              </button>
            )}
          </fieldset>
        </form>
      </Panel>
    </div>
  );
}
