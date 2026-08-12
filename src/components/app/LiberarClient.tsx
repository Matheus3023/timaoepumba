"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Estado = "parado" | "verificando" | "nao_encontrado" | "erro";

/**
 * Tela de liberação de acesso.
 *
 * Dois caminhos, nesta ordem de destaque:
 *  1. Criar conta na casa — passa por /api/affiliate/click, que anexa o Lead
 *     ID como parâmetro rastreado e registra o clique. Nunca link cru.
 *  2. "Já me cadastrei" — segunda via para quem se cadastrou e ficou preso
 *     porque o postback não chegou.
 */
export function LiberarClient({ houseName }: { houseName: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("parado");

  async function verificar() {
    setEstado("verificando");
    try {
      const response = await fetch("/api/affiliate/verify", { method: "POST" });
      const data = (await response.json()) as { released?: boolean };

      if (data.released) {
        // `refresh` antes de navegar: o layout do app relê o access_level no
        // servidor, e sem isso a navegação usaria o cache antigo e jogaria o
        // usuário de volta para cá.
        router.refresh();
        router.replace("/home");
        return;
      }
      setEstado("nao_encontrado");
    } catch {
      setEstado("erro");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-strong">Falta um passo</h1>
        <p className="text-secondary">
          Os palpites, as análises e a comunidade são liberados para quem tem conta na {houseName}. É de
          graça e leva um minuto.
        </p>
      </div>

      <div className="card flex flex-col gap-4">
        <ol className="flex flex-col gap-3 text-sm text-secondary">
          <li className="flex gap-3">
            <span className="font-mono font-semibold text-yellow-300">1</span>
            <span>Toque no botão abaixo e crie sua conta na {houseName}.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono font-semibold text-yellow-300">2</span>
            <span>Volte aqui. Seu acesso libera sozinho, normalmente na hora.</span>
          </li>
        </ol>

        <a href="/api/affiliate/click" rel="sponsored" className="btn-primary w-full text-center">
          Criar minha conta na {houseName}
        </a>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={verificar}
          disabled={estado === "verificando"}
          className="text-sm text-secondary underline underline-offset-4 disabled:opacity-60"
        >
          {estado === "verificando" ? "Verificando…" : "Já me cadastrei, verificar agora"}
        </button>

        {estado === "nao_encontrado" ? (
          <p className="text-center text-sm text-muted">
            Ainda não recebemos a confirmação da {houseName}. Ela costuma chegar em alguns minutos — tente de
            novo em instantes. Se já faz mais tempo, fale com a gente pelo suporte.
          </p>
        ) : null}

        {estado === "erro" ? (
          <p className="text-center text-sm text-muted">
            Não conseguimos verificar agora. Tente novamente em alguns segundos.
          </p>
        ) : null}
      </div>
    </main>
  );
}
