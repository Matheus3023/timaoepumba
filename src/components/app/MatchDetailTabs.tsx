"use client";

import { useState } from "react";
import type { HeadToHeadMatch, MatchEvent, MatchLineup, MomentumPoint, Standing } from "@/lib/sports/types";
import type { OddsMarket } from "@/lib/odds/types";
import { OddsTab } from "@/components/app/OddsTab";
import { EmptyState } from "@/components/ui/EmptyState";

const TABS = ["Resumo", "Odds", "Eventos", "Estatísticas", "Escalações", "Momentum", "Classificação", "H2H"] as const;

const EVENT_LABEL: Record<MatchEvent["type"], string> = {
  goal: "⚽ Gol",
  yellow_card: "🟨 Cartao amarelo",
  red_card: "🟥 Cartao vermelho",
  substitution: "🔄 Substituicao",
  var: "📺 VAR",
  unknown: "• Evento",
};

export function MatchDetailTabs({
  kickoffLabel,
  competition,
  events,
  statistics,
  standings,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  h2h,
  homeTeamRecent,
  awayTeamRecent,
  lineups,
  momentum,
  houseMarkets,
  houseName,
  houseUrl,
  houseEventId,
}: {
  kickoffLabel: string;
  competition: string;
  events: MatchEvent[];
  statistics: Record<string, { home: number | string; away: number | string }>;
  standings: Standing[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  h2h: HeadToHeadMatch[];
  homeTeamRecent: HeadToHeadMatch[];
  awayTeamRecent: HeadToHeadMatch[];
  lineups: MatchLineup[];
  momentum: MomentumPoint[];
  houseMarkets: OddsMarket[];
  houseName: string;
  houseUrl: string;
  houseEventId: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumo");
  const statEntries = Object.entries(statistics);

  return (
    <div className="mt-5">
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-surface-elevated">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-sm transition ${
              tab === t ? "border-b-2 border-primary text-yellow-300" : "text-muted hover:text-body"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Resumo" && (
          <div className="card flex flex-col gap-2 text-sm">
            <Row label="Competicao" value={competition} />
            <Row label="Data" value={kickoffLabel} />
          </div>
        )}

        {tab === "Eventos" &&
          (events.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {events.map((event) => (
                <li key={event.id} className="card flex items-center justify-between text-sm">
                  <span className="text-body">
                    {EVENT_LABEL[event.type]} {event.playerName && `— ${event.playerName}`}
                  </span>
                  {event.minute !== null && <span className="text-muted">{event.minute}&apos;</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum evento disponivel para esta partida ainda." />
          ))}

        {tab === "Odds" ? (
          <OddsTab
            markets={houseMarkets}
            houseName={houseName}
            houseUrl={houseUrl}
            eventId={houseEventId}
            eventName={`${homeTeamName} x ${awayTeamName}`}
          />
        ) : null}

        {tab === "Estatísticas" &&
          (statEntries.length > 0 ? (
            <div className="card flex flex-col gap-3.5">
              <SeriesLegend homeTeamName={homeTeamName} awayTeamName={awayTeamName} />
              {statEntries.map(([label, values]) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-strong">{values.home}</span>
                    <span className="text-secondary">{label}</span>
                    <span className="font-semibold text-strong">{values.away}</span>
                  </div>
                  <StatBar home={values.home} away={values.away} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Estatisticas indisponiveis para esta partida." />
          ))}

        {tab === "Escalações" &&
          (lineups.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lineups.map((lineup) => (
                <div key={lineup.teamId} className="card">
                  <p className="text-xs text-muted">
                    {lineup.teamId === homeTeamId ? homeTeamName : lineup.teamId === awayTeamId ? awayTeamName : "Time"}
                    {lineup.formation && ` • ${lineup.formation}`}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-strong">
                    {lineup.players.map((player, i) => (
                      <li key={i}>{player}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Escalacoes indisponiveis para esta partida ainda." />
          ))}

        {tab === "Momentum" &&
          (momentum.length > 0 ? (
            <div className="card">
              <p className="mb-3 text-xs text-secondary">Pressao ao longo da partida</p>
              <div className="flex h-32 items-end gap-0.5">
                {momentum.map((point, i) => {
                  const height = Math.min(Math.abs(point.value), 100);
                  const isHome = point.value >= 0;
                  return (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                      <div
                        className={`w-full rounded-t-[4px] ${isHome ? "bg-chart-home" : "bg-chart-away"}`}
                        style={{ height: `${height}%` }}
                        title={`${point.minute}' — ${isHome ? homeTeamName : awayTeamName}: ${Math.abs(point.value)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <SeriesLegend homeTeamName={homeTeamName} awayTeamName={awayTeamName} />
              </div>
            </div>
          ) : (
            <EmptyState title="Momentum indisponível para esta partida." />
          ))}

        {tab === "Classificação" &&
          (standings.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 pr-2">#</th>
                    <th className="py-1 pr-2">Time</th>
                    <th className="py-1 pr-2 text-center">PJ</th>
                    <th className="py-1 pr-2 text-center">V</th>
                    <th className="py-1 pr-2 text-center">E</th>
                    <th className="py-1 pr-2 text-center">D</th>
                    <th className="py-1 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr
                      key={row.teamId}
                      className={`border-t border-surface-elevated ${
                        row.teamName === homeTeamName || row.teamName === awayTeamName ? "text-yellow-300" : "text-body"
                      }`}
                    >
                      <td className="py-1.5 pr-2">{row.position}</td>
                      <td className="py-1.5 pr-2">{row.teamName}</td>
                      <td className="py-1.5 pr-2 text-center">{row.played}</td>
                      <td className="py-1.5 pr-2 text-center">{row.wins}</td>
                      <td className="py-1.5 pr-2 text-center">{row.draws}</td>
                      <td className="py-1.5 pr-2 text-center">{row.losses}</td>
                      <td className="py-1.5 text-center font-semibold">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Classificação indisponível para esta partida." />
          ))}

        {tab === "H2H" && (
          <div className="flex flex-col gap-5">
            <RecentForm title={`Ultimos jogos — ${homeTeamName}`} teamName={homeTeamName} matches={homeTeamRecent} />
            <RecentForm title={`Ultimos jogos — ${awayTeamName}`} teamName={awayTeamName} matches={awayTeamRecent} />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-strong">Confronto direto</h3>
              {h2h.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {h2h.map((m) => (
                    <li key={m.id} className="card text-sm">
                      <p className="text-xs text-muted">
                        {m.competition ?? "—"} {m.date && `• ${new Date(m.date).toLocaleDateString("pt-BR")}`}
                      </p>
                      <p className="mt-1 font-medium text-white">
                        {m.homeTeam} {m.homeScore ?? "-"} - {m.awayScore ?? "-"} {m.awayTeam}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Nenhum confronto anterior encontrado." />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function resultForTeam(m: HeadToHeadMatch, teamName: string): "V" | "E" | "D" | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  const isHome = m.homeTeam === teamName;
  const own = isHome ? m.homeScore : m.awayScore;
  const opp = isHome ? m.awayScore : m.homeScore;
  if (own === opp) return "E";
  return own > opp ? "V" : "D";
}

const RESULT_STYLE: Record<"V" | "E" | "D", string> = {
  V: "bg-emerald-500/15 text-emerald-300",
  E: "bg-surface-highlighted/40 text-body",
  D: "bg-red-500/15 text-red-300",
};

function RecentForm({ title, teamName, matches }: { title: string; teamName: string; matches: HeadToHeadMatch[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-strong">{title}</h3>
        {matches.length > 0 && (
          <div className="flex gap-1">
            {matches.map((m) => {
              const result = resultForTeam(m, teamName);
              return (
                <span
                  key={m.id}
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    result ? RESULT_STYLE[result] : "bg-surface-elevated text-muted"
                  }`}
                >
                  {result ?? "—"}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {matches.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id} className="card flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted">
                  {m.competition ?? "—"} {m.date && `• ${new Date(m.date).toLocaleDateString("pt-BR")}`}
                </p>
                <p className="truncate font-medium text-white">
                  {m.homeTeam} {m.homeScore ?? "-"} - {m.awayScore ?? "-"} {m.awayTeam}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={`Sem jogos recentes de ${teamName} disponiveis.`} />
      )}
    </div>
  );
}

/**
 * Identity legend for the two-series charts. The swatch carries the
 * identity; the label stays in a normal text color rather than the series
 * color, so it never has to pass contrast as coloured text.
 */
function SeriesLegend({ homeTeamName, awayTeamName }: { homeTeamName: string; awayTeamName: string }) {
  return (
    <div className="flex items-center justify-center gap-4 text-[11px] text-secondary">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-chart-home" />
        <span className="truncate">{homeTeamName}</span>
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-chart-away" />
        <span className="truncate">{awayTeamName}</span>
      </span>
    </div>
  );
}

/**
 * Proportional comparison bar. Both teams get a real hue — the away side
 * used to be plain grey, which reads as "missing data" instead of as the
 * second team. The 2px gap keeps the two fills legible where they meet.
 */
function StatBar({ home, away }: { home: number | string; away: number | string }) {
  const h = typeof home === "number" ? home : Number(home);
  const a = typeof away === "number" ? away : Number(away);
  if (!Number.isFinite(h) || !Number.isFinite(a) || h + a === 0) return null;
  const homePct = (h / (h + a)) * 100;
  return (
    <div className="mt-1.5 flex h-2 gap-0.5">
      <div className="rounded-l-[4px] bg-chart-home" style={{ width: `${homePct}%` }} />
      <div className="rounded-r-[4px] bg-chart-away" style={{ width: `${100 - homePct}%` }} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-right text-strong">{value}</span>
    </div>
  );
}
