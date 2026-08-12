"use client";

import { useMemo, useState } from "react";

import type { OddsMarket } from "@/lib/odds/types";
import {
  combinedOdds,
  formatMoney,
  formatOdd,
  isSelected,
  potentialReturn,
  toggleSelection,
  type SlipSelection,
} from "@/lib/odds/betSlip";
import { EmptyState } from "@/components/ui/EmptyState";
import { BetSheet } from "@/components/app/BetSheet";

const VALORES_RAPIDOS = [10, 25, 50, 100];

/**
 * Ordem de leitura dos grupos. O que não estiver aqui vai para o fim, na
 * ordem em que a casa mandou.
 */
const ORDEM_GRUPOS = ["Principal", "Gols", "Escanteios", "1° tempo", "2° tempo", "Cartões"];

/**
 * Quantos mercados aparecem por grupo antes do "ver mais".
 *
 * A casa manda MUITO mais do que cabe numa tela: um Palmeiras x Cerro veio
 * com 1931 mercados em 11 grupos. Renderizar tudo de uma vez trava o
 * aparelho e ninguém rola até o fim. Só o primeiro grupo abre sozinho.
 */
const MERCADOS_POR_GRUPO = 6;

/**
 * Teto absoluto por grupo, mesmo depois de "ver mais".
 *
 * Um grupo sozinho pode ter mais de mil mercados (o "Criar Aposta" de um
 * Palmeiras x Cerro tinha). Expandir sem teto trava o aparelho do mesmo
 * jeito. O que passar disso não é escondido em silêncio: a tela diz quantos
 * ficaram e onde estão.
 */
const TETO_POR_GRUPO = 40;

/**
 * Aba de Odds com boletim.
 *
 * O app não aceita aposta — quem aceita é a casa, que tem a licença. O
 * boletim existe para o usuário montar a seleção aqui, ver o retorno, e sair
 * uma vez só já sabendo o que vai apostar, em vez de cair no site genérico e
 * ter que caçar o jogo.
 */
export function OddsTab({
  markets,
  houseName,
  eventId,
  eventName,
}: {
  markets: OddsMarket[];
  houseName: string;
  eventId: string;
  eventName: string;
}) {
  const [slip, setSlip] = useState<SlipSelection[]>([]);
  const [apostando, setApostando] = useState(false);
  const [stake, setStake] = useState<number>(25);

  const grupos = useMemo(() => {
    const mapa = new Map<string, OddsMarket[]>();
    for (const market of markets) {
      // Mercado sem opção com preço não vira botão nenhum — fora, para não
      // criar grupo vazio que o usuário abre e não encontra nada.
      if (market.selections.length === 0) continue;
      const chave = market.group ?? "Mercados";
      mapa.set(chave, [...(mapa.get(chave) ?? []), market]);
    }
    const ordenado = [...mapa.entries()].sort(([a], [b]) => {
      const ia = ORDEM_GRUPOS.indexOf(a);
      const ib = ORDEM_GRUPOS.indexOf(b);
      return (ia === -1 ? ORDEM_GRUPOS.length : ia) - (ib === -1 ? ORDEM_GRUPOS.length : ib);
    });
    return ordenado;
  }, [markets]);

  const [aberto, setAberto] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const grupoAberto = aberto ?? grupos[0]?.[0] ?? null;

  const odds = combinedOdds(slip);
  const retorno = potentialReturn(slip, stake);

  if (markets.length === 0) {
    return (
      <EmptyState
        title="Sem cotações no momento"
        description={`A ${houseName} não está oferecendo mercado para este jogo agora. Perto do fim da partida vários mercados fecham.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      {grupos.map(([grupo, itens]) => {
        const estaAberto = grupo === grupoAberto;
        const mostrarTodos = expandido[grupo] === true;
        const limite = mostrarTodos ? TETO_POR_GRUPO : MERCADOS_POR_GRUPO;
        const visiveis = itens.slice(0, limite);
        const restantes = itens.length - visiveis.length;

        return (
          <section key={grupo} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setAberto(estaAberto ? "" : grupo)}
              aria-expanded={estaAberto}
              className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2.5 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-strong">{grupo}</span>
              <span className="font-mono text-xs text-muted">
                {itens.length} {estaAberto ? "−" : "+"}
              </span>
            </button>

            {estaAberto
              ? visiveis.map((market) => (
                  <div key={market.providerMarketId} className="card flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-strong">{market.name}</span>
                      {market.line ? <span className="font-mono text-xs text-muted">{market.line}</span> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {market.selections.map((selection, index) => {
                        const marcada = isSelected(slip, market.providerMarketId, selection.name);
                        return (
                          <button
                            key={`${market.providerMarketId}-${index}`}
                            type="button"
                            aria-pressed={marcada}
                            onClick={() =>
                              setSlip((atual) =>
                                toggleSelection(atual, {
                                  marketId: market.providerMarketId,
                                  marketName: market.name,
                                  line: market.line ?? null,
                                  selectionName: selection.name,
                                  odd: selection.price,
                                  eventId,
                                  eventName,
                                })
                              )
                            }
                            className={`flex min-w-[7.5rem] flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 transition ${
                              marcada
                                ? "bg-primary text-black"
                                : "bg-surface-elevated text-secondary hover:bg-surface-elevated/70"
                            }`}
                          >
                            <span className="text-xs">{selection.name}</span>
                            <span className="font-mono text-sm font-semibold tabular-nums">
                              {formatOdd(selection.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              : null}

            {estaAberto && !mostrarTodos && restantes > 0 ? (
              <button
                type="button"
                onClick={() => setExpandido((atual) => ({ ...atual, [grupo]: true }))}
                className="text-xs text-secondary underline underline-offset-4"
              >
                ver mais {Math.min(restantes, TETO_POR_GRUPO - MERCADOS_POR_GRUPO)} mercados
              </button>
            ) : null}

            {estaAberto && mostrarTodos && restantes > 0 ? (
              <p className="text-xs text-muted">
                Mais {restantes} mercados deste grupo estão disponíveis na {houseName}.
              </p>
            ) : null}
          </section>
        );
      })}

      {slip.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-4">
          <div className="card flex flex-col gap-3 border border-primary/40 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-strong">
                {slip.length === 1 ? "Sua seleção" : `Múltipla · ${slip.length} seleções`}
              </span>
              <button type="button" onClick={() => setSlip([])} className="text-xs text-muted underline">
                limpar
              </button>
            </div>

            <ul className="flex flex-col gap-1.5">
              {slip.map((item) => (
                <li key={`${item.marketId}-${item.selectionName}`} className="flex justify-between gap-3 text-xs">
                  <span className="text-secondary">
                    {item.selectionName}
                    <span className="text-muted"> · {item.marketName}</span>
                  </span>
                  <span className="font-mono tabular-nums text-strong">{formatOdd(item.odd)}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              {VALORES_RAPIDOS.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setStake(valor)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                    stake === valor ? "bg-primary text-black" : "bg-surface-elevated text-secondary"
                  }`}
                >
                  {formatMoney(valor)}
                </button>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-surface-elevated pt-2.5">
              <span className="text-xs text-muted">
                Odd total <span className="font-mono tabular-nums text-strong">{formatOdd(odds)}</span>
              </span>
              <span className="text-sm text-secondary">
                Retorno <span className="font-mono font-semibold tabular-nums text-yellow-300">{formatMoney(retorno)}</span>
              </span>
            </div>

            {/* Abre a casa DENTRO do app em vez de mandar o usuario embora.
                `houseUrl` continua sendo /api/affiliate/click, que e o que
                anexa o afp e registra o clique — ver BetSheet. */}
            <button type="button" onClick={() => setApostando(true)} className="btn-primary w-full text-center">
              Apostar na {houseName}
            </button>

            {/* A aposta é registrada na casa, não aqui. Dizer isso evita que
                alguém ache que apostou só por ter montado o boletim. */}
            <p className="text-center text-[11px] leading-snug text-muted">
              Você finaliza a aposta na {houseName}. As cotações podem mudar até a confirmação.
              <br />
              +18. Jogue com responsabilidade. Apostar não é investimento.
            </p>
          </div>
        </div>
      ) : null}

      {/* Montado so quando aberto: o estado interno da camada se reinicia
          sozinho a cada abertura, sem reset manual. */}
      {apostando ? (
        <BetSheet onClose={() => setApostando(false)} houseName={houseName} eventName={eventName} />
      ) : null}
    </div>
  );
}
