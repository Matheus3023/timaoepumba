"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Match } from "@/lib/sports/types";
import { MatchRow } from "@/components/app/MatchRow";
import { LeagueBadge } from "@/components/app/LeagueBadge";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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
          <span className={`h-1.5 w-1.5 rounded-full ${tab === "ao_vivo" ? "bg-red-600" : "animate-pulse-live bg-red-500"}`} />
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
        <div className="mt-4 flex flex-col gap-2.5">
          {liveMatches.length === 0 && <p className="card text-sm text-neutral-500">Nenhum jogo ao vivo agora.</p>}
          {liveMatches.map((match, i) => (
            <motion.div key={match.id} initial="hidden" animate="show" custom={i} variants={fadeUp}>
              <MatchRow match={match} />
            </motion.div>
          ))}
        </div>
      )}

      {tab === "hoje" && (
        <div className="mt-4">
          {groupedUpcoming.length === 0 && <p className="card text-sm text-neutral-500">Nenhum jogo cadastrado para hoje.</p>}
          {groupedUpcoming.map(([league, matches], sectionIndex) => (
            <motion.section
              key={league}
              className="mt-5 first:mt-0"
              initial="hidden"
              animate="show"
              custom={sectionIndex}
              variants={fadeUp}
            >
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-200">
                <LeagueBadge name={league} logoUrl={matches[0]?.league.logoUrl} size={16} />
                {league}
              </h2>
              <div className="flex flex-col gap-2.5">
                {matches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
