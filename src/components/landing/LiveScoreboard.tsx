import { TeamAvatar } from "@/components/app/TeamAvatar";
import type { TickerMatch } from "@/lib/landing/ticker";

/**
 * Painel de jogos da landing.
 *
 * E a unica prova social honesta que a pagina tem: os jogos sao os de hoje,
 * vindos da mesma fonte que o app usa por dentro (ver lib/landing/ticker).
 * Por isso ele nao e um enfeite do hero, e conteudo.
 *
 * Quando nao ha partida, o painel some inteiro. Faixa vazia diz menos que
 * faixa nenhuma, e inventar jogo esta fora de questao.
 *
 * Layout unico para os dois tamanhos: no celular vira uma tira que rola na
 * horizontal, no desktop vira uma lista vertical ao lado do titulo. Mesmo
 * markup, so muda a direcao, entao nao existe conteudo duplicado no HTML.
 */

function TeamLine({
  name,
  logo,
  score,
  showScore,
}: {
  name: string;
  logo: string | null;
  score: number | null;
  showScore: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamAvatar name={name} logoUrl={logo} size={20} />
      <span className="min-w-0 flex-1 truncate text-[13px] leading-tight text-strong">{name}</span>
      {/* Largura reservada mesmo sem placar: as duas linhas do confronto
          ficam alinhadas e o numero nao empurra o nome de lado quando o gol
          sai ao vivo. */}
      <span className="w-4 shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-white">
        {showScore ? (score ?? 0) : ""}
      </span>
    </div>
  );
}

export function LiveScoreboard({ matches }: { matches: TickerMatch[] }) {
  if (matches.length === 0) return null;

  const liveCount = matches.filter((match) => match.live).length;

  return (
    <section
      aria-labelledby="placar-de-hoje"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0f0d]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <h2
          id="placar-de-hoje"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-secondary"
        >
          {liveCount > 0 ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-live" />
              {liveCount === 1 ? "1 jogo ao vivo" : `${liveCount} jogos ao vivo`}
            </>
          ) : (
            "Jogos de hoje"
          )}
        </h2>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          tempo real
        </span>
      </div>

      <ul className="scrollbar-none flex divide-x divide-white/[0.06] overflow-x-auto lg:block lg:divide-x-0 lg:divide-y lg:overflow-visible">
        {matches.map((match) => (
          <li key={match.id} className="w-[216px] shrink-0 px-4 py-3.5 lg:w-auto">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                {match.league}
              </p>
              <p
                className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${
                  match.live ? "text-primary" : "text-muted"
                }`}
              >
                {match.live ? (
                  <>
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-live align-middle" />
                    {match.minute !== null ? `${match.minute}'` : "AO VIVO"}
                  </>
                ) : (
                  match.kickoffLabel
                )}
              </p>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5">
              <TeamLine
                name={match.homeName}
                logo={match.homeLogo}
                score={match.homeScore}
                showScore={match.live}
              />
              <TeamLine
                name={match.awayName}
                logo={match.awayLogo}
                score={match.awayScore}
                showScore={match.live}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
