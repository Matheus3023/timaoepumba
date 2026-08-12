"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sportsbook da casa montado DENTRO do app.
 *
 * Não é iframe: é o Widget SDK da própria plataforma (Altenar) carregado na
 * nossa página. O usuário vê a nossa navegação e a nossa marca, e o boletim
 * de apostas da casa aparece ali — a aposta é registrada nela, na
 * infraestrutura licenciada dela, sem o usuário sair daqui.
 *
 * `toggleSelections` é o que fecha o ciclo: as cotações que a pessoa marcou
 * no NOSSO boletim chegam prontas no boletim da casa. Sem isso ela teria de
 * remarcar tudo do outro lado, que é o atrito que estamos eliminando.
 *
 * Sobre atribuição: a comissão é por jogador, definida no CADASTRO — e o
 * cadastro passa obrigatoriamente por /api/affiliate/click (o portão de
 * acesso força isso). Montar o widget aqui não muda de quem é o jogador.
 */

declare global {
  interface Window {
    altenarWSDK?: {
      init: (config: Record<string, unknown>) => Promise<void> | void;
      addSportsBook: (options: { props?: Record<string, unknown>; container: HTMLElement }) => void;
      toggleSelections: (oddIds: number[]) => void;
    };
  }
}

const SDK_URL = process.env.NEXT_PUBLIC_HOUSE_WSDK_URL ?? "https://sb2wsdk-altenar2.biahosted.com/altenarWSDK.js";
const INTEGRATION = process.env.NEXT_PUBLIC_HOUSE_INTEGRATION ?? "bateu";

/** Carrega o SDK uma vez só, mesmo com várias montagens na mesma sessão. */
let carregando: Promise<void> | null = null;

function carregarSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.altenarWSDK) return Promise.resolve();
  if (carregando) return carregando;

  carregando = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("nao foi possivel carregar o SDK da casa"));
    document.head.appendChild(script);
  });
  return carregando;
}

export type EstadoSportsbook = "carregando" | "pronto" | "erro";

export function HouseSportsbook({
  oddIds,
  onEstado,
}: {
  /** Cotações que já vêm marcadas do nosso boletim. */
  oddIds: number[];
  onEstado?: (estado: EstadoSportsbook) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<EstadoSportsbook>("carregando");

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        await carregarSdk();
        if (!vivo || !container.current || !window.altenarWSDK) return;

        await window.altenarWSDK.init({
          integration: INTEGRATION,
          culture: "pt-BR",
          countryCode: "BR",
          themeName: "default",
        });
        if (!vivo || !container.current) return;

        window.altenarWSDK.addSportsBook({
          // "overview" e o nome de pagina que o SDK reconhece; "sports"
          // devolvia [WSDK] page not found e deixava a tela em branco.
          props: { page: "overview" },
          container: container.current,
        });

        setEstado("pronto");

        // NAO pre-marcamos a selecao por enquanto.
        //
        // toggleSelections estoura com "Cannot read properties of undefined
        // (reading 'odd')" mesmo depois do widget montar: o id que a nossa
        // listagem carrega (providerOddId da API REST) NAO e o mesmo que o
        // boletim do SDK indexa internamente. Passar o id errado deixa o
        // boletim vazio e polui o console.
        //
        // Ate mapear o id certo, o comportamento e: o usuario ja chega no
        // jogo certo, com a cartela aberta, e marca a odd dentro do widget.
        // E menos do que o ideal, mas honesto — melhor do que um boletim que
        // aparece vazio sem o usuario entender por que.
        void oddIds;
      } catch {
        if (vivo) setEstado("erro");
      }
    })();

    return () => {
      vivo = false;
    };
    // Só na montagem: o SDK controla o DOM do container a partir daqui, e
    // remontar a cada mudança de seleção destruiria o boletim que o usuário
    // já está preenchendo do lado da casa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onEstado?.(estado);
  }, [estado, onEstado]);

  return (
    <div className="relative flex-1 overflow-auto">
      {estado === "carregando" ? (
        <p className="p-6 text-center text-sm text-muted">Carregando a casa…</p>
      ) : null}
      {estado === "erro" ? (
        <p className="p-6 text-center text-sm text-muted">
          Não foi possível carregar a casa aqui dentro. Use o link abaixo para abrir em uma aba nova.
        </p>
      ) : null}
      <div ref={container} />
    </div>
  );
}
