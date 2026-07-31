"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileActions({ marketingConsent }: { marketingConsent: boolean }) {
  const router = useRouter();
  const [optedIn, setOptedIn] = useState(marketingConsent);
  const [busy, setBusy] = useState(false);

  async function toggleMarketing() {
    setBusy(true);
    const next = !optedIn;
    await fetch("/api/account/optout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opted_out: !next }),
    });
    setOptedIn(next);
    setBusy(false);
  }

  async function handleExport() {
    const response = await fetch("/api/account/export");
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-dados.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja solicitar a exclusao da sua conta?")) return;
    setBusy(true);
    await fetch("/api/account/delete", { method: "POST" });
    router.push("/");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <section className="card mt-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-200">Privacidade e consentimento</h2>

      <label className="flex items-center justify-between text-sm text-neutral-300">
        Receber novidades e promocoes
        <input type="checkbox" checked={optedIn} disabled={busy} onChange={toggleMarketing} />
      </label>

      <button onClick={handleExport} className="btn-secondary">
        Exportar meus dados
      </button>

      <button onClick={handleDelete} disabled={busy} className="btn-secondary text-red-400">
        Solicitar exclusao da conta
      </button>

      <button onClick={handleLogout} className="btn-secondary">
        Sair
      </button>
    </section>
  );
}
