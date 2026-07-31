"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

interface InstallPromptContextValue {
  /** True once the browser has fired beforeinstallprompt and we can trigger it. */
  isAvailable: boolean;
  /** Shows the native install prompt. Must be called from a user gesture handler. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

/**
 * Captures the `beforeinstallprompt` event as early as possible (mounted in
 * the root layout) so it is available by the time the onboarding screen
 * asks the user to install the app. Per PRD onboarding sec. 2, the native
 * prompt is only ever triggered from a real user click via promptInstall().
 */
export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const deferredEvent = useRef<BeforeInstallPromptEvent | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
      event.preventDefault();
      deferredEvent.current = event;
      setIsAvailable(true);
    }

    function handleAppInstalled() {
      deferredEvent.current = null;
      setIsAvailable(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    const event = deferredEvent.current;
    if (!event) return "unavailable";

    await event.prompt();
    const result = await event.userChoice;
    deferredEvent.current = null;
    setIsAvailable(false);
    return result.outcome;
  }

  return (
    <InstallPromptContext.Provider value={{ isAvailable, promptInstall }}>
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt() {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error("useInstallPrompt must be used within InstallPromptProvider");
  }
  return ctx;
}
