"use client";

import { useEffect, useState } from "react";

/**
 * Camada de aposta dentro do app.
 *
 * A casa aceita ser embutida (testado: sem `X-Frame-Options`, sem bloqueio de
 * CSP), então o usuário aposta aqui dentro em vez de ser jogado para o
 * navegador. Quem recebe a aposta continua sendo a casa, na infraestrutura
 * licenciada dela — o app só deixa de perder o usuário no meio do caminho.
 *
 * A `src` aponta para `/api/affiliate/click`, nunca para o link cru: é essa
 * rota que anexa o Lead ID como `afp`, registra o clique e move o estágio no
 * CRM. Ela responde 302 e o iframe segue o redirecionamento até a casa.
 *
 * BOTÃO DE ESCAPE, e o motivo dele: dentro do iframe a casa vira contexto de
 * TERCEIRO, e o navegador pode bloquear o cookie de sessão dela. Se isso
 * acontecer o usuário não consegue manter o login e trava na hora de
 * confirmar. "Abrir na Bateu Bet" resolve na hora, em vez de deixar o cara
 * numa tela morta — que é o pior desfecho possível com tráfego pago rodando.
 */
export function BetSheet({
  onClose,
  houseName,
  eventName,
}: {
  onClose: () => void;
  houseName: string;
  eventName: string;
}) {
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

      <iframe
        src="/api/affiliate/click"
        title={`Apostar na ${houseName}`}
        className="flex-1 border-0"
        // SEM `sandbox` de propósito. Com o atributo aplicado o quadro voltava
        // em branco: a casa passa por protecao anti-bot e o proprio
        // sportsbook e uma aplicacao que espera contexto normal. No teste sem
        // sandbox ela carrega inteira. Sandbox aqui daria uma sensacao de
        // seguranca sem entregar nada — o conteudo e de terceiro de qualquer
        // forma, e quem protege o usuario e a origem separada, nao o atributo.
        referrerPolicy="no-referrer-when-downgrade"
      />

      <footer className="flex flex-col gap-1.5 border-t border-surface-elevated px-4 py-2.5">
        {demorou ? (
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
