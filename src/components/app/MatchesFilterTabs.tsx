"use client";

import { useState } from "react";
import type { Match } from "@/lib/sports/types";
import { MatchRow } from "@/components/app/MatchRow";

export function MatchesFilterTabs({
  liveMatches,
  groupedUpcoming,
}: {
  liveMatches: Match[];
  groupedUpcoming: [string, Match[]][];
}) {
  const [tab, setTab] = useState<"ao_vivo" | "hoje">(liveMatches.length > 0 ? "ao_vivo" : "hoje");

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("ao_vivo")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "ao_vivo" ? "bg-yellow-400 text-neutral-900" : "bg-neutral-900 text-neutral-400"
          }`}
        >
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-500" />
          Ao vivo {liveMatches.length > 0 && `(${liveMatches.length})`}
        </button>
        <button
          onClick={() => setTab("hoje")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab === "hoje" ? "bg-yellow-400 text-neutral-900" : "bg-neutral-900 text-neutral-400"
          }`}
        >
          Hoje
        </button>
      </div>

      {tab === "ao_vivo" && (
        <div className="mt-4 flex flex-col gap-2">
          {liveMatches.length === 0 && <p className="card text-sm text-neutral-500">Nenhum jogo ao vivo agora.</p>}
          {liveMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}

      {tab === "hoje" && (
        <div className="mt-4">
          {groupedUpcoming.length === 0 && <p className="card text-sm text-neutral-500">Nenhum jogo cadastrado para hoje.</p>}
          {groupedUpcoming.map(([league, matches]) => (
            <section key={league} className="mt-4 first:mt-0">
              <h2 className="mb-2 text-sm font-semibold text-neutral-200">{league}</h2>
              <div className="flex flex-col gap-2">
                {matches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
