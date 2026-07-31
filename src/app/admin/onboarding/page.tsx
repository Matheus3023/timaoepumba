import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { DEFAULT_ONBOARDING_CONFIG, type OnboardingConfig } from "@/lib/onboarding/config";

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
  await logAudit({ actorId: access.adminId, action: "onboarding_config_updated", entityType: "system_settings", entityId: "onboarding_config" });
  revalidatePath("/admin/onboarding");
}

export default async function AdminOnboardingPage() {
  const access = await requireAdminSection("onboarding");
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
  const installClicked = profiles?.filter((p) => p.pwa_install_clicked_at).length ?? 0;
  const installed = profiles?.filter((p) => p.pwa_install_status === "installed").length ?? 0;
  const notifRequested = profiles?.filter((p) => p.notification_permission_requested_at).length ?? 0;
  const notifGranted = profiles?.filter((p) => p.notification_permission === "granted").length ?? 0;
  const completed = profiles?.filter((p) => p.onboarding_completed).length ?? 0;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-white">Onboarding e instalacao</h1>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Contas criadas" value={total} />
        <Metric label="Instalacao solicitada" value={installClicked} />
        <Metric label="Instalado" value={installed} />
        <Metric label="Notificacao solicitada" value={notifRequested} />
        <Metric label="Notificacao autorizada" value={notifGranted} />
        <Metric label="Onboarding concluido" value={completed} />
      </section>

      <form action={saveConfig} className="card mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-200">Textos e etapas</h2>
        <fieldset disabled={!canWrite(access, "onboarding")} className="flex flex-col gap-3 disabled:opacity-60">
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Titulo (boas-vindas)
            <input name="welcome_title" defaultValue={config.welcome_title} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Texto (boas-vindas)
            <textarea name="welcome_text" defaultValue={config.welcome_text} rows={2} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Titulo (notificacoes)
            <input name="notifications_title" defaultValue={config.notifications_title} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Texto (notificacoes)
            <textarea name="notifications_text" defaultValue={config.notifications_text} rows={2} className="input" />
          </label>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="install_step_enabled" defaultChecked={config.install_step_enabled} />
            Etapa de instalacao ativa
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="notifications_step_enabled" defaultChecked={config.notifications_step_enabled} />
            Etapa de notificacoes ativa
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="onboarding_required" defaultChecked={config.onboarding_required} />
            Onboarding obrigatorio
          </label>

          {canWrite(access, "onboarding") && (
            <button type="submit" className="btn-primary mt-2 self-start px-6">
              Salvar
            </button>
          )}
        </fieldset>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}
