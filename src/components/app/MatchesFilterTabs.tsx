"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Match } from "@/lib/sports/types";
import { MatchRow } from "@/components/app/MatchRow";
import { LeagueBadge } from "@/components/app/LeagueBadge";
import { EmptyState } from "@/components/ui/EmptyState";

const LIVE_REFRESH_INTERVAL_MS = 30_000;

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
  showLiveTab = true,
}: {
  liveMatches: Match[];
  groupedUpcoming: [string, Match[]][];
  showLiveTab?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"ao_vivo" | "hoje">(showLiveTab && liveMatches.length > 0 ? "ao_vivo" : "hoje");

  // Keeps live scores/minutes moving without a manual pull-to-refresh —
  // re-runs the server component (which re-checks the 45s sports_api_cache
  // TTL) on an interval while this page is open.
  useEffect(() => {
    if (!showLiveTab) return;
    const id = setInterval(() => router.refresh(), LIVE_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router, showLiveTab]);

  return (
    <div className="mt-4">
      {showLiveTab && (
        <div className="flex gap-2" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "ao_vivo"}
            onClick={() => setTab("ao_vivo")}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.98] ${
              tab === "ao_vivo"
                ? "border-transparent bg-primary text-surface"
                : "border-white/[0.06] bg-surface/60 text-secondary hover:text-strong"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tab === "ao_vivo" ? "bg-surface/60" : "animate-pulse-live bg-red-500"}`} />
            Ao vivo {liveMatches.length > 0 && `(${liveMatches.length})`}
          </button>
          <button
            role="tab"
            aria-selected={tab === "hoje"}
            onClick={() => setTab("hoje")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.98] ${
              tab === "hoje"
                ? "border-transparent bg-primary text-surface"
                : "border-white/[0.06] bg-surface/60 text-secondary hover:text-strong"
            }`}
          >
            Todos os jogos
          </button>
        </div>
      )}

      {showLiveTab && tab === "ao_vivo" && (
        <div className="mt-4 flex flex-col gap-2.5">
          {liveMatches.length === 0 && (
            <EmptyState title="Nenhum jogo ao vivo agora" description="Volte mais tarde ou confira os jogos de hoje." />
          )}
          {liveMatches.map((match, i) => (
            <motion.div key={match.id} initial="hidden" animate="show" custom={i} variants={fadeUp}>
              <MatchRow match={match} />
            </motion.div>
          ))}
        </div>
      )}

      {(!showLiveTab || tab === "hoje") && (
        <div className="mt-4">
          {groupedUpcoming.length === 0 && <EmptyState title="Nenhum jogo cadastrado para este dia" />}
          {groupedUpcoming.map(([league, matches], sectionIndex) => (
            <motion.section
              key={league}
              className="mt-5 first:mt-0"
              initial="hidden"
              animate="show"
              custom={sectionIndex}
              variants={fadeUp}
            >
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-strong">
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
