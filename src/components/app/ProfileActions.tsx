"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ProfileActions({ marketingConsent }: { marketingConsent: boolean }) {
  const router = useRouter();
  const [optedIn, setOptedIn] = useState(marketingConsent);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

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

  async function confirmDelete() {
    setDeleteOpen(false);
    setBusy(true);
    await fetch("/api/account/delete", { method: "POST" });
    router.push("/");
  }

  async function confirmLogout() {
    setLogoutOpen(false);
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

      <button onClick={() => setDeleteOpen(true)} disabled={busy} className="btn-secondary text-red-400">
        Solicitar exclusao da conta
      </button>

      <button onClick={() => setLogoutOpen(true)} className="btn-secondary">
        Sair
      </button>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir sua conta?"
        description="Isso solicita a exclusao definitiva da sua conta e dos seus dados. Essa acao nao pode ser desfeita."
        confirmLabel="Excluir conta"
        destructive
      />

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
        title="Sair da conta?"
        description="Voce precisara fazer login novamente para acessar o aplicativo."
        confirmLabel="Sair"
      />
    </section>
  );
}
