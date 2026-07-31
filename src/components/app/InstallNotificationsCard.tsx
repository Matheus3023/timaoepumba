"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInstallPrompt } from "@/lib/onboarding/InstallPromptProvider";
import { detectBrowser, detectDevice, isIOS, isRunningStandalone } from "@/lib/onboarding/deviceDetection";
import { getFcmToken } from "@/lib/push/firebaseClient";

export function InstallNotificationsCard({
  initialInstallStatus,
  initialNotificationPermission,
}: {
  initialInstallStatus: string;
  initialNotificationPermission: string;
}) {
  const router = useRouter();
  const { isAvailable, promptInstall } = useInstallPrompt();
  const [ios] = useState(() => isIOS());
  const [standalone] = useState(() => isRunningStandalone());
  const [installStatus, setInstallStatus] = useState(initialInstallStatus);
  const [notificationPermission, setNotificationPermission] = useState(initialNotificationPermission);
  const [busyInstall, setBusyInstall] = useState(false);
  const [busyNotifications, setBusyNotifications] = useState(false);

  const installed = standalone || installStatus === "installed";
  const notificationsActive = notificationPermission === "granted";

  async function handleInstall() {
    if (ios) return;
    setBusyInstall(true);
    const outcome = await promptInstall();
    if (outcome === "accepted") setInstallStatus("installed");
    setBusyInstall(false);
  }

  async function handleActivateNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setBusyNotifications(true);
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      const token = await getFcmToken();
      if (token) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcm_token: token, device: detectDevice(), browser: detectBrowser() }),
        }).catch(() => {});
      }
    }

    setBusyNotifications(false);
    router.refresh();
  }

  return (
    <section className="card mt-4">
      <h2 className="text-sm font-semibold text-neutral-200">Instalacao e notificacoes</h2>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
        <li>Aplicativo instalado: {installed ? "sim" : "nao"}</li>
        <li>Notificacoes: {notificationPermission}</li>
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        {!installed &&
          (ios ? (
            <p className="text-xs text-neutral-500">
              No iPhone: toque em compartilhar (□↑) no Safari e depois em &quot;Adicionar a Tela de Inicio&quot;.
            </p>
          ) : (
            <button onClick={handleInstall} disabled={busyInstall || !isAvailable} className="btn-secondary">
              {busyInstall ? "Abrindo..." : isAvailable ? "Instalar aplicativo" : "Instalacao indisponivel neste navegador"}
            </button>
          ))}

        {!notificationsActive && notificationPermission !== "denied" && (
          <button onClick={handleActivateNotifications} disabled={busyNotifications} className="btn-secondary">
            {busyNotifications ? "Ativando..." : "Ativar notificacoes"}
          </button>
        )}
        {notificationPermission === "denied" && (
          <p className="text-xs text-neutral-500">
            Notificacoes bloqueadas no navegador — ative manualmente nas configuracoes do site para receber alertas.
          </p>
        )}
      </div>
    </section>
  );
}
