"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { OnboardingConfig } from "@/lib/onboarding/config";
import { useInstallPrompt } from "@/lib/onboarding/InstallPromptProvider";
import { detectBrowser, detectDevice, isIOS, isRunningStandalone } from "@/lib/onboarding/deviceDetection";
import { getFcmToken } from "@/lib/push/firebaseClient";
import { ALERT_TYPES, POPULAR_LEAGUES, POPULAR_TEAMS } from "@/lib/sports/popularOptions";
import type { OnboardingEventType } from "@/lib/onboarding/onboardingEvents";

type Step = "install" | "notifications" | "personalization";

function useOnboardingEventLogger() {
  return (type: OnboardingEventType) => {
    fetch("/api/onboarding/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).catch(() => {});
  };
}

export function OnboardingFlow({
  config,
  initialInstallStatus,
  initialNotificationPermission,
}: {
  config: OnboardingConfig;
  initialInstallStatus: string;
  initialNotificationPermission: string;
}) {
  const router = useRouter();
  const { isAvailable, promptInstall } = useInstallPrompt();
  const logEvent = useOnboardingEventLogger();

  // isIOS()/isRunningStandalone() safely no-op (return false) when called
  // outside a browser, so a lazy useState initializer is enough — it runs
  // once during the client mount/hydration pass, no effect needed.
  const [ios] = useState(() => isIOS());
  const [standalone] = useState(() => isRunningStandalone());
  const [notificationPermission, setNotificationPermission] = useState(initialNotificationPermission);
  const [busy, setBusy] = useState(false);

  const skipInstall = !config.install_step_enabled || standalone || initialInstallStatus === "installed";
  const skipNotifications =
    !config.notifications_step_enabled ||
    notificationPermission === "granted" ||
    notificationPermission === "denied";

  const steps = useMemo(() => {
    const list: Step[] = [];
    if (!skipInstall) list.push("install");
    if (!skipNotifications) list.push("notifications");
    list.push("personalization");
    return list;
  }, [skipInstall, skipNotifications]);

  const [step, setStep] = useState<Step>(() => steps[0]);

  const stepNumber = step === "install" ? 1 : step === "notifications" ? 2 : null;
  const totalNumberedSteps = [skipInstall ? null : "install", skipNotifications ? null : "notifications"].filter(
    Boolean
  ).length;

  function goToNextAfter(current: Step) {
    const idx = steps.indexOf(current);
    const next = steps[idx + 1] ?? "personalization";
    setStep(next);
  }

  async function handleInstallClick() {
    logEvent("install_button_clicked");

    if (ios) {
      setStep("notifications");
      return;
    }

    if (!isAvailable) {
      logEvent("install_unavailable");
      goToNextAfter("install");
      return;
    }

    const outcome = await promptInstall();
    if (outcome === "accepted") {
      logEvent("install_accepted");
    } else if (outcome === "dismissed") {
      logEvent("install_dismissed");
    } else {
      logEvent("install_unavailable");
    }
    goToNextAfter("install");
  }

  function handleSkipInstall() {
    logEvent("install_dismissed");
    goToNextAfter("install");
  }

  async function handleActivateNotifications() {
    logEvent("notif_permission_button_clicked");

    if (typeof window === "undefined" || !("Notification" in window)) {
      logEvent("notif_unsupported");
      goToNextAfter("notifications");
      return;
    }

    setBusy(true);
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      logEvent("notif_granted");
      const token = await getFcmToken();
      if (token) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcm_token: token, device: detectDevice(), browser: detectBrowser() }),
        }).catch(() => {});
      }
    } else if (permission === "denied") {
      logEvent("notif_denied");
    } else {
      logEvent("notif_dismissed");
    }

    setBusy(false);
    goToNextAfter("notifications");
  }

  function handleSkipNotifications() {
    logEvent("notif_dismissed");
    goToNextAfter("notifications");
  }

  useEffect(() => {
    if (step === "install") logEvent("install_prompt_viewed");
    if (step === "notifications") logEvent("notif_prompt_viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0b0f0c] px-6 py-10">
      {stepNumber && totalNumberedSteps > 0 && (
        <div className="mx-auto mb-8 w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Passo {stepNumber} de {totalNumberedSteps} —{" "}
            {step === "install" ? "Instale o aplicativo" : "Ative as notificacoes"}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(stepNumber / totalNumberedSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {step === "install" && (
          <InstallStep
            config={config}
            ios={ios}
            onInstall={handleInstallClick}
            onSkip={handleSkipInstall}
          />
        )}

        {step === "notifications" && (
          <NotificationsStep
            config={config}
            ios={ios}
            standalone={standalone}
            busy={busy}
            onActivate={handleActivateNotifications}
            onSkip={handleSkipNotifications}
          />
        )}

        {step === "personalization" && (
          <PersonalizationStep
            onDone={async () => {
              router.push("/home");
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function InstallStep({
  config,
  ios,
  onInstall,
  onSkip,
}: {
  config: OnboardingConfig;
  ios: boolean;
  onInstall: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Image src="/icons/icon-512.png" alt="Timao e Pumba Tips" width={64} height={64} className="h-16 w-16 rounded-2xl" priority />

      <div>
        <h1 className="text-2xl font-bold text-white">{config.welcome_title}</h1>
        <p className="mt-2 text-secondary">{config.welcome_text}</p>
      </div>

      {ios ? (
        <ol className="flex flex-col gap-3 text-sm text-body">
          {config.ios_instructions.map((instruction, index) => (
            <li key={instruction} className="card flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-surface">
                {index + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="flex flex-col gap-2">
          {config.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-body">
              <span className="text-primary">✓</span> {benefit}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3">
        <button onClick={onInstall} className="btn-primary">
          {ios ? "ENTENDI, VOU INSTALAR" : config.install_button_label}
        </button>
        <button onClick={onSkip} className="btn-secondary">
          {config.skip_install_button_label}
        </button>
      </div>
    </div>
  );
}

function NotificationsStep({
  config,
  ios,
  standalone,
  busy,
  onActivate,
  onSkip,
}: {
  config: OnboardingConfig;
  ios: boolean;
  standalone: boolean;
  busy: boolean;
  onActivate: () => void;
  onSkip: () => void;
}) {
  const iosNotInstalled = ios && !standalone;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{config.notifications_title}</h1>
        <p className="mt-2 text-secondary">{config.notifications_text}</p>
      </div>

      {iosNotInstalled ? (
        <>
          <p className="card text-sm text-body">
            Para receber notificacoes no iPhone, adicione o aplicativo a Tela de Inicio e abra-o
            pelo novo icone.
          </p>
          <button onClick={onSkip} className="btn-primary">
            CONTINUAR
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <button onClick={onActivate} disabled={busy} className="btn-primary">
            {busy ? "Ativando..." : config.notifications_button_label}
          </button>
          <button onClick={onSkip} className="btn-secondary">
            {config.skip_notifications_button_label}
          </button>
        </div>
      )}
    </div>
  );
}

function PersonalizationStep({ onDone }: { onDone: () => void }) {
  const [team, setTeam] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({
    new_analysis: true,
    match_start: true,
    live_goals: true,
    community_news: true,
    account_updates: true,
  });
  const [saving, setSaving] = useState(false);

  function toggleLeague(id: string) {
    setLeagues((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  }

  async function handleFinish() {
    setSaving(true);
    await fetch("/api/onboarding/personalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite_leagues: leagues, alert_preferences: alerts }),
    }).catch(() => {});

    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skipped: false }),
    }).catch(() => {});

    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Personalize sua experiencia</h1>
        <p className="mt-2 text-secondary">
          Escolha seu time, campeonatos favoritos e os alertas que deseja receber. Voce pode
          alterar isso depois no seu perfil.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-strong">Time favorito</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeam(t.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                team === t.id
                  ? "border-primary bg-primary/10 text-yellow-300"
                  : "border-surface-highlighted text-body"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-strong">Campeonatos favoritos</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LEAGUES.map((l) => (
            <button
              key={l.id}
              onClick={() => toggleLeague(l.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                leagues.includes(l.id)
                  ? "border-primary bg-primary/10 text-yellow-300"
                  : "border-surface-highlighted text-body"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-strong">Tipos de alerta</p>
        <div className="flex flex-col gap-2">
          {ALERT_TYPES.map((a) => (
            <label key={a.key} className="flex items-center justify-between text-sm text-body">
              {a.label}
              <input
                type="checkbox"
                checked={alerts[a.key] ?? false}
                onChange={(e) => setAlerts((prev) => ({ ...prev, [a.key]: e.target.checked }))}
              />
            </label>
          ))}
        </div>
      </div>

      <button onClick={handleFinish} disabled={saving} className="btn-primary">
        {saving ? "Salvando..." : "COMECAR A USAR"}
      </button>
    </div>
  );
}
