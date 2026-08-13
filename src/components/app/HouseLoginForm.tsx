"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type Estado = "parado" | "entrando" | "credenciais" | "indisponivel";

/**
 * Login com a conta da casa (Bateu), com a cara do app.
 *
 * O usuário digita o MESMO email/CPF e senha da conta da casa. O backend
 * repassa para a casa, recebe o token de sessão e libera o app — uma conta
 * só, sem sair daqui. A senha nunca é guardada.
 */
export function HouseLoginForm({ houseName }: { houseName: string }) {
  const router = useRouter();
  const loginId = useId();
  const senhaId = useId();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, setEstado] = useState<Estado>("parado");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("entrando");
    try {
      const r = await fetch("/api/house/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password: senha }),
      });

      if (r.ok) {
        // O layout do app relê o nível no servidor; refresh antes de navegar
        // para não voltar por causa de cache.
        router.refresh();
        router.replace("/home");
        return;
      }
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      setEstado(data.error === "credenciais" ? "credenciais" : "indisponivel");
    } catch {
      setEstado("indisponivel");
    }
  }

  const cadastroUrl = "/api/affiliate/click";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-strong">Entrar</h1>
        <p className="text-sm text-secondary">
          Use o mesmo e-mail (ou CPF) e senha da sua conta {houseName}. É com ela que você aposta e acompanha
          os palpites aqui dentro.
        </p>
      </div>

      <form onSubmit={entrar} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={loginId} className="text-sm text-body">
            E-mail ou CPF
          </label>
          <input
            id={loginId}
            value={login}
            onChange={(ev) => setLogin(ev.target.value)}
            autoComplete="username"
            required
            className="input"
            placeholder="seu@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={senhaId} className="text-sm text-body">
            Senha da {houseName}
          </label>
          <input
            id={senhaId}
            type="password"
            value={senha}
            onChange={(ev) => setSenha(ev.target.value)}
            autoComplete="current-password"
            required
            minLength={6}
            className="input"
            placeholder="Sua senha da conta"
          />
        </div>

        {estado === "credenciais" ? (
          <p className="text-sm text-red-400">E-mail/CPF ou senha incorretos. Confira e tente de novo.</p>
        ) : null}
        {estado === "indisponivel" ? (
          <p className="text-sm text-red-400">
            Não conseguimos entrar agora. Tente novamente em instantes.
          </p>
        ) : null}

        <button type="submit" disabled={estado === "entrando"} className="btn-primary min-h-[52px]">
          {estado === "entrando" ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="flex flex-col items-center gap-2 border-t border-surface-elevated pt-5">
        <p className="text-sm text-secondary">Ainda não tem conta na {houseName}?</p>
        <a href={cadastroUrl} rel="sponsored" className="text-sm font-semibold text-yellow-300 underline underline-offset-4">
          Criar minha conta na {houseName}
        </a>
        <p className="text-center text-xs text-muted">
          Depois de criar, volte aqui e entre com o mesmo e-mail e senha.
        </p>
      </div>
    </main>
  );
}
