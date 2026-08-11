import Link from "next/link";
import type { Match } from "@/lib/sports/types";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import { LeagueBadge } from "@/components/app/LeagueBadge";

export function MatchRow({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeWon = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWon = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <Link
      href={`/jogos/${match.id}`}
      /* Faixa de 3px na borda esquerda marca o estado, como no card de sinal
         do DESIGN.md — custa menos atenção que tingir o fundo inteiro, que
         era o que a linha ao vivo fazia antes. */
      className={`card-interactive relative flex flex-col gap-2.5 border border-[var(--hud-rule)] bg-[var(--hud-deck)] px-3.5 py-3 ${
        isLive ? "border-l-[3px] border-l-[var(--hud-off)]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <LeagueBadge name={match.league.name} logoUrl={match.league.logoUrl} size={14} />
          {/* Nome da liga vira rótulo de HUD: condensado, maiúsculo, tracking
              aberto. É metadado, não deve competir com o placar. */}
          <span className="truncate font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.12em] text-muted">
            {match.league.name}
          </span>
        </div>

        {isLive ? (
          <span className="flex shrink-0 items-center gap-1.5 text-[var(--hud-off)]">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-[var(--hud-off)]" />
            <span className="hud-data text-[13px] font-bold">
              {match.minute ? `${match.minute}'` : "AO VIVO"}
            </span>
          </span>
        ) : isFinished ? (
          <span className="shrink-0 font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.12em] text-muted">
            Encerrado
          </span>
        ) : (
          <span className="hud-data shrink-0 text-[13px] text-body">
            {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <TeamLine
          name={match.homeTeam.name}
          logoUrl={match.homeTeam.logoUrl}
          score={match.homeScore}
          showScore={isLive || isFinished}
          highlight={homeWon}
        />
        <TeamLine
          name={match.awayTeam.name}
          logoUrl={match.awayTeam.logoUrl}
          score={match.awayScore}
          showScore={isLive || isFinished}
          highlight={awayWon}
        />
      </div>

      {match.odds && !isFinished && (
        /* Grade de métrica do DESIGN.md: divisórias de 1px em vez de três
           pílulas soltas, então as odds leem como uma faixa de dados. */
        <div className="flex border-t border-[var(--hud-rule-soft)] pt-2.5">
          <OddsCell label="1" value={match.odds.home} />
          <OddsCell label="X" value={match.odds.draw} />
          <OddsCell label="2" value={match.odds.away} />
        </div>
      )}
    </Link>
  );
}

/* Rótulo em cima, número embaixo: em painel de transmissão o olho busca o
   valor, então ele fica na linha de baixo, maior e em mono. */
function OddsCell({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-1 flex-col gap-0.5 border-l border-[var(--hud-rule-soft)] px-2.5 first:border-l-0 first:pl-0">
      <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="hud-data text-[13px] font-medium text-strong">{value.toFixed(2)}</span>
    </span>
  );
}

function TeamLine({
  name,
  logoUrl,
  score,
  showScore,
  highlight,
}: {
  name: string;
  logoUrl?: string | null;
  score: number | null;
  showScore: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamAvatar name={name} logoUrl={logoUrl} size={26} />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${highlight ? "font-semibold text-strong" : "text-body"}`}
      >
        {name}
      </span>
      {showScore && (
        /* Largura fixa + tabular: os dois placares ficam alinhados na coluna,
           então o olho compara na vertical sem os dígitos escorregarem. */
        <span
          className={`hud-data w-5 text-right text-[15px] ${
            highlight ? "font-bold text-[var(--hud-live)]" : "font-medium text-secondary"
          }`}
        >
          {score ?? 0}
        </span>
      )}
    </div>
  );
}
