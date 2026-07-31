import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logTimelineEvent } from "@/lib/crm/timeline";
import { trackServerEvent, type TrackingEventName } from "@/lib/tracking/events";
import type { UserProfileRow } from "@/types/database";

export type OnboardingEventType =
  | "install_prompt_viewed"
  | "install_button_clicked"
  | "install_accepted"
  | "install_dismissed"
  | "install_unavailable"
  | "standalone_open"
  | "notif_prompt_viewed"
  | "notif_permission_button_clicked"
  | "notif_granted"
  | "notif_denied"
  | "notif_dismissed"
  | "notif_unsupported";

interface EventDef {
  trackingEvent: TrackingEventName;
  timelineDescription: string;
  profilePatch: (now: string) => Partial<UserProfileRow>;
}

const now = () => new Date().toISOString();

const EVENT_DEFS: Record<OnboardingEventType, EventDef> = {
  install_prompt_viewed: {
    trackingEvent: "PWAInstallPromptViewed",
    timelineDescription: "Visualizou a instalacao do aplicativo",
    profilePatch: (n) => ({ pwa_install_status: "prompt_viewed", pwa_install_prompt_viewed_at: n }),
  },
  install_button_clicked: {
    trackingEvent: "PWAInstallButtonClicked",
    timelineDescription: "Clicou em instalar o aplicativo",
    profilePatch: (n) => ({ pwa_install_clicked_at: n }),
  },
  install_accepted: {
    trackingEvent: "PWAInstallAccepted",
    timelineDescription: "Instalou o aplicativo",
    profilePatch: (n) => ({ pwa_install_status: "installed", pwa_installed_at: n }),
  },
  install_dismissed: {
    trackingEvent: "PWAInstallDismissed",
    timelineDescription: "Recusou a instalacao do aplicativo",
    profilePatch: () => ({ pwa_install_status: "dismissed" }),
  },
  install_unavailable: {
    trackingEvent: "PWAInstallUnavailable",
    timelineDescription: "Instalacao do aplicativo indisponivel neste navegador",
    profilePatch: () => ({ pwa_install_status: "unavailable" }),
  },
  standalone_open: {
    trackingEvent: "PWAOpenedStandalone",
    timelineDescription: "Abriu o aplicativo instalado pela primeira vez",
    profilePatch: (n) => ({ pwa_first_standalone_open_at: n }),
  },
  notif_prompt_viewed: {
    trackingEvent: "PushOnboardingViewed",
    timelineDescription: "Visualizou a ativacao de notificacoes",
    profilePatch: (n) => ({ notification_prompt_viewed_at: n }),
  },
  notif_permission_button_clicked: {
    trackingEvent: "PushPermissionButtonClicked",
    timelineDescription: "Clicou em ativar notificacoes",
    profilePatch: (n) => ({ notification_permission_requested_at: n }),
  },
  notif_granted: {
    trackingEvent: "PushPermissionGranted",
    timelineDescription: "Autorizou notificacoes",
    profilePatch: (n) => ({
      notification_permission: "granted",
      notification_permission_granted_at: n,
    }),
  },
  notif_denied: {
    trackingEvent: "PushPermissionDenied",
    timelineDescription: "Negou notificacoes",
    profilePatch: (n) => ({
      notification_permission: "denied",
      notification_permission_denied_at: n,
    }),
  },
  notif_dismissed: {
    trackingEvent: "PushPermissionDismissed",
    timelineDescription: "Adiou a ativacao de notificacoes",
    profilePatch: () => ({ notification_permission: "default" }),
  },
  notif_unsupported: {
    trackingEvent: "PushUnsupported",
    timelineDescription: "Notificacoes nao suportadas neste dispositivo",
    profilePatch: () => ({ notification_permission: "unsupported" }),
  },
};

export async function recordOnboardingEvent(userId: string, type: OnboardingEventType) {
  const def = EVENT_DEFS[type];
  const supabase = createAdminSupabaseClient();
  const timestamp = now();
  const patch = def.profilePatch(timestamp);

  if (type === "install_dismissed") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("pwa_install_decline_count")
      .eq("user_id", userId)
      .maybeSingle();
    Object.assign(patch, {
      pwa_install_decline_count: (profile?.pwa_install_decline_count ?? 0) + 1,
      pwa_install_last_declined_at: timestamp,
    });
  }

  await Promise.all([
    supabase.from("user_profiles").update(patch).eq("user_id", userId),
    logTimelineEvent({ userId, eventType: `onboarding_${type}`, description: def.timelineDescription }),
    trackServerEvent({ eventName: def.trackingEvent, userId }),
  ]);
}
