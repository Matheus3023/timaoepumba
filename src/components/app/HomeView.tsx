"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Match } from "@/lib/sports/types";
import { MatchRow } from "@/components/app/MatchRow";
import { CheckCircleIcon, ChatIcon, LockIcon } from "@/components/icons";

const RISK_STYLE: Record<string, string> = {
  baixo: "bg-emerald-500/15 text-emerald-300",
  medio: "bg-yellow-500/15 text-yellow-300",
  alto: "bg-red-500/15 text-red-300",
};

interface AnalysisPreview {
  id: string;
  title: string;
  summary: string | null;
  risk_level: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const HOME_MATCHES_PREVIEW_LIMIT = 4;

export function HomeView({
  firstName,
  registrationDone,
  communityUnlocked,
  ftdDone,
  todayMatches,
  analyses,
}: {
  firstName: string;
  registrationDone: boolean;
  communityUnlocked: boolean;
  ftdDone: boolean;
  todayMatches: Match[];
  analyses: AnalysisPreview[];
}) {
  const steps = [
    { label: "Conta no aplicativo", done: true },
    { label: "Cadastro na parceira", done: registrationDone },
    { label: "Comunidade liberada", done: communityUnlocked },
    { label: "Recursos FTD", done: ftdDone },
  ];
  const allStepsDone = registrationDone && communityUnlocked && ftdDone;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">
          Ola, <span className="text-gradient-gold">{firstName}</span>!
        </h1>
        <p className="text-sm text-neutral-400">Confira os jogos e novidades de hoje.</p>
      </motion.div>

      {!allStepsDone && (
        <motion.section initial="hidden" animate="show" custom={1} variants={fadeUp} className="card-glow mt-5">
          <h2 className="text-sm font-semibold text-neutral-200">Status da conta</h2>
          <div className="relative mt-4 flex justify-between">
            <div className="absolute left-4 right-4 top-3.5 h-px bg-white/10" />
            {steps.map((step, i) => (
              <div key={step.label} className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 18 }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                    step.done
                      ? "border-yellow-400 bg-yellow-400/15 text-yellow-400"
                      : "border-neutral-700 bg-neutral-900 text-neutral-600"
                  }`}
                >
                  {step.done ? <CheckCircleIcon width={14} height={14} /> : <LockIcon width={12} height={12} />}
                </motion.span>
                <span className={`max-w-[70px] text-[10px] leading-tight ${step.done ? "text-neutral-300" : "text-neutral-600"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {!registrationDone && (
            <a href="/api/affiliate/click" className="btn-primary mt-5 block text-center">
              Cadastrar na casa parceira
            </a>
          )}
        </motion.section>
      )}

      <Section title="Jogos de hoje" delay={2} action={{ href: "/jogos", label: "Ver todos" }}>
        {todayMatches.length === 0 && <EmptyState text="Nenhum jogo cadastrado para hoje." />}
        {todayMatches.slice(0, HOME_MATCHES_PREVIEW_LIMIT).map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </Section>

      <Section title="Analises recentes" delay={3} action={{ href: "/analises", label: "Ver todas" }}>
        {analyses.length === 0 && <EmptyState text="Nenhuma analise publicada ainda." />}
        {analyses.map((analysis) => (
          <Link key={analysis.id} href={`/analises/${analysis.id}`} className="card block transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{analysis.title}</p>
              {analysis.risk_level && (
                <span className={`badge shrink-0 ${RISK_STYLE[analysis.risk_level] ?? "bg-neutral-700/40 text-neutral-300"}`}>
                  {analysis.risk_level}
                </span>
              )}
            </div>
            {analysis.summary && <p className="mt-1 text-sm text-neutral-400">{analysis.summary}</p>}
          </Link>
        ))}
      </Section>

      <motion.section initial="hidden" animate="show" custom={4} variants={fadeUp} className="mt-6">
        <Link
          href="/comunidade"
          className="card-glow group flex items-center justify-between transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
              <ChatIcon width={19} height={19} />
            </div>
            <div>
              <p className="font-semibold text-white">Bate-papo</p>
              <p className="text-xs text-neutral-400">
                {communityUnlocked ? "Salas, enquetes e resenha ao vivo" : "Confirme o cadastro para liberar"}
              </p>
            </div>
          </div>
          <span className="text-neutral-500 transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </motion.section>
    </div>
  );
}

function Section({
  title,
  action,
  delay = 0,
  live = false,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  delay?: number;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section initial="hidden" animate="show" custom={delay} variants={fadeUp} className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-200">
          {live && <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-500" />}
          {title}
        </h2>
        {action && (
          <Link href={action.href} className="text-xs text-yellow-400">
            {action.label}
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </motion.section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="card text-sm text-neutral-500">{text}</p>;
}
