"use client";

import { useState } from "react";
import { DepositModal } from "@/components/app/DepositModal";

/**
 * Botão de depósito.
 *
 * Com NEXT_PUBLIC_HOUSE_INAPP_DEPOSIT="true", abre o PIX por DENTRO do app
 * (igual ao JR Club). Caso contrário, cai no comportamento antigo: link
 * direto pro caixa da casa (link de afiliado, nova aba). A flag permite
 * subir o código desligado e ligar sem novo deploy.
 */

const INAPP = process.env.NEXT_PUBLIC_HOUSE_INAPP_DEPOSIT === "true";
const DEPOSIT_URL = process.env.NEXT_PUBLIC_HOUSE_DEPOSIT_URL ?? "https://bateu.bet.br/";
const HOUSE_NAME = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";

export function DepositButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const label = (
    <>
      <span aria-hidden>💰</span>
      Depositar {INAPP ? "" : `na ${HOUSE_NAME}`}
    </>
  );
  const cls = `btn-primary flex min-h-[52px] items-center justify-center gap-2 text-center text-[15px] font-bold ${className}`;

  if (!INAPP) {
    return (
      <a href={DEPOSIT_URL} target="_blank" rel="sponsored noopener noreferrer" className={cls}>
        {label}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>
        {label}
      </button>
      {open && <DepositModal onClose={() => setOpen(false)} />}
    </>
  );
}
