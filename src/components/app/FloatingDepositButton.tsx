"use client";

import { useState } from "react";
import { DepositModal } from "@/components/app/DepositModal";

/**
 * Botão de depósito FLUTUANTE, fixo em todas as telas.
 *
 * Com NEXT_PUBLIC_HOUSE_INAPP_DEPOSIT="true", abre o PIX por dentro do app;
 * senão, link direto pro caixa da casa (comportamento antigo).
 */

const INAPP = process.env.NEXT_PUBLIC_HOUSE_INAPP_DEPOSIT === "true";
const DEPOSIT_URL = process.env.NEXT_PUBLIC_HOUSE_DEPOSIT_URL ?? "https://bateu.bet.br/";

const cls =
  "fixed right-4 z-40 flex min-h-[46px] items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-black shadow-lg shadow-black/30 active:scale-95";
const style = { bottom: "calc(4.75rem + env(safe-area-inset-bottom))" } as const;

export function FloatingDepositButton() {
  const [open, setOpen] = useState(false);

  if (!INAPP) {
    return (
      <a
        href={DEPOSIT_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label="Depositar na casa"
        className={cls}
        style={style}
      >
        <span aria-hidden className="text-base">💰</span>
        Depositar
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Depositar" className={cls} style={style}>
        <span aria-hidden className="text-base">💰</span>
        Depositar
      </button>
      {open && <DepositModal onClose={() => setOpen(false)} />}
    </>
  );
}
