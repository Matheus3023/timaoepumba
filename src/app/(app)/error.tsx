"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Fronteira de erro do app.
 *
 * O projeto não tinha nenhuma: quando o provedor esportivo caía e não havia
 * cache válido, `/jogos` e `/home` estouravam com a tela de erro crua do
 * Next. Agora a falha fica contida na tela, o resto da navegação continua
 * de pé e a pessoa tem um botão para tentar de novo.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] erro nao tratado na tela", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <ErrorState
        title="Não consegui carregar esta tela"
        description="Pode ter sido uma instabilidade momentânea nos dados. Tente de novo em instantes."
        onRetry={reset}
      />
    </div>
  );
}
