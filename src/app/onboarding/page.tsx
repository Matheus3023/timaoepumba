import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_ONBOARDING_CONFIG, type OnboardingConfig } from "@/lib/onboarding/config";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: settingsRow }, { data: profile }] = await Promise.all([
    supabase.from("system_settings").select("value").eq("key", "onboarding_config").maybeSingle(),
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profile?.onboarding_completed) {
    redirect("/home");
  }

  const config: OnboardingConfig = {
    ...DEFAULT_ONBOARDING_CONFIG,
    ...((settingsRow?.value as Partial<OnboardingConfig>) ?? {}),
  };

  return (
    <OnboardingFlow
      config={config}
      initialInstallStatus={profile?.pwa_install_status ?? "not_requested"}
      initialNotificationPermission={profile?.notification_permission ?? "not_requested"}
    />
  );
}
