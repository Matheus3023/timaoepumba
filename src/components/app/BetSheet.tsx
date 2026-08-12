"use client";

import { useCallback, useEffect, useState } from "react";

import { HouseSportsbook, type EstadoSportsbook } from "@/components/app/HouseSportsbook";

/**
 * Camada de aposta dentro do app.
 *
 * O sportsbook da casa é montado AQUI, pelo Widget SDK da plataforma dela —
 * não é iframe do site. O usuário fica na nossa navegação, com a nossa
 * marca, e o boletim dela aparece nesta camada. Quem recebe a aposta
 * continua sendo a casa, com a licença dela; o app só para de perder o
 * usuário no meio do caminho.
 *
 * As cotações que a pessoa marcou no nosso boletim vão junto (`oddIds`) e
 * chegam prontas no boletim dela — ver HouseSportsbook.
 *
 * BOTÃO DE ESCAPE: se o SDK não carregar, ou se o login não segurar nesta
 * origem, "Abrir na casa" resolve na hora em vez de deixar o usuário numa
 * tela morta — o pior desfecho possível com tráfego pago rodando.
 */
export function BetSheet({
  onClose,
  houseName,
  eventName,
  oddIds,
}: {
  onClose: () => void;
  houseName: string;
  eventName: string;
  /** Cotações marcadas no nosso boletim, para chegarem prontas no dela. */
  oddIds: number[];
}) {
  const [estado, setEstado] = useState<EstadoSportsbook>("carregando");
  const aoMudarEstado = useCallback((e: EstadoSportsbook) => setEstado(e), []);
  const [demorou, setDemorou] = useState(false);

  // Se em 6s o usuário ainda estiver aqui parado, oferecemos a saída antes
  // que ele conclua sozinho que o app está quebrado. O componente é montado
  // e desmontado pelo pai, então o estado se reinicia sozinho — não há
  // reset manual dentro do efeito.
  useEffect(() => {
    const t = setTimeout(() => setDemorou(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Fecha no Esc e trava o scroll do fundo enquanto a camada está aberta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={`Apostar na ${houseName}`}>
      <header className="flex items-center justify-between gap-3 border-b border-surface-elevated px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-strong">{houseName}</p>
          <p className="truncate text-xs text-muted">{eventName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg bg-surface-elevated px-3 py-1.5 text-sm text-secondary"
        >
          Fechar
        </button>
      </header>

      <HouseSportsbook oddIds={oddIds} onEstado={aoMudarEstado} />

      <footer className="flex flex-col gap-1.5 border-t border-surface-elevated px-4 py-2.5">
        {demorou || estado === "erro" ? (
          <p className="text-center text-[11px] text-muted">
            Se a {houseName} não carregar ou pedir login toda hora, abra em uma aba nova — alguns navegadores
            bloqueiam o acesso à conta dentro do aplicativo.
          </p>
        ) : null}
        <a
          href="/api/affiliate/click"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-center text-xs text-secondary underline underline-offset-4"
        >
          Abrir na {houseName}
        </a>
      </footer>
    </div>
  );
}
