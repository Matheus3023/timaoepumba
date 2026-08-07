"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BallIcon, ChartIcon, ChatIcon, ShieldIcon } from "@/components/icons";

const TICKER_MATCHES = [
  { league: "Brasileirao", home: "Corinthians", away: "Palmeiras", status: "62'", score: "1-1" },
  { league: "Libertadores", home: "Flamengo", away: "River Plate", status: "Hoje 21:30", score: null },
  { league: "Champions League", home: "Real Madrid", away: "Man City", status: "Hoje 17:00", score: null },
  { league: "Brasileirao", home: "Sao Paulo", away: "Gremio", status: "38'", score: "0-0" },
];

const FEATURES = [
  {
    icon: BallIcon,
    title: "Jogos ao vivo",
    description: "Placar, eventos e estatisticas em tempo real de todos os campeonatos que voce acompanha.",
  },
  {
    icon: ChartIcon,
    title: "Analises de especialistas",
    description: "Conteudo publicado por analistas de verdade, com mercado, risco e contexto — nunca automatico.",
  },
  {
    icon: ChatIcon,
    title: "Comunidade ativa",
    description: "Salas por campeonato, enquetes, reacoes e resenha ao vivo com outros torcedores.",
  },
];

const STEPS = [
  { title: "Crie sua conta", description: "Leva menos de um minuto." },
  { title: "Cadastre-se na parceira", description: "Um clique gera seu link exclusivo." },
  { title: "Comunidade liberada", description: "Acesso as salas assim que confirmar." },
  { title: "Recursos completos", description: "Analises premium e salas exclusivas." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#080b09]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float-slow rounded-full bg-emerald-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 animate-float-slower rounded-full bg-primary/10 blur-[100px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/icon-512.png"
            alt="Timao e Pumba Tips"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-lg shadow-yellow-500/20"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Timao<span className="text-primary">&</span>Pumba
          </span>
        </div>
        <span className="badge gap-1.5 border border-red-500/30 bg-red-500/10 text-red-300">
          <ShieldIcon width={13} height={13} /> 18+
        </span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-8 text-center">
        <motion.span
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="badge border border-primary/20 bg-primary/[0.07] text-yellow-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-primary" />
          Jogos, analises e comunidade em um so lugar
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl"
        >
          Viva o jogo com a <span className="text-gradient-gold">torcida</span>, nao sozinho
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mt-4 max-w-md text-balance text-secondary"
        >
          Acompanhe partidas ao vivo, leia analises de quem entende e participe da comunidade
          Timao e Pumba — tudo dentro do app, direto no seu celular.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-8 flex w-full max-w-xs flex-col gap-3"
        >
          <Link href="/signup" className="btn-primary text-center text-[15px]">
            CRIAR CONTA GRATIS
          </Link>
          <Link href="/login" className="btn-secondary text-center">
            JA TENHO CONTA
          </Link>
        </motion.div>

        {/* Live ticker */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={4}
          variants={fadeUp}
          className="glass-panel mt-10 w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-left">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Rolando agora</p>
          </div>
          <div className="flex divide-x divide-white/5 overflow-x-auto">
            {TICKER_MATCHES.map((match) => (
              <div key={`${match.home}-${match.away}`} className="min-w-[190px] flex-1 px-4 py-3 text-left">
                <p className="truncate text-[11px] text-muted">{match.league}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-white">
                  {match.home} <span className="text-faint">vs</span> {match.away}
                </p>
                <p className={`mt-0.5 text-xs font-semibold ${match.score ? "text-primary" : "text-muted"}`}>
                  {match.score ? `${match.score} • ${match.status}` : match.status}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              variants={fadeUp}
              className="card group text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <feature.icon width={20} height={20} />
              </div>
              <h3 className="mt-3 font-semibold text-white">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 w-full max-w-3xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-sm font-semibold uppercase tracking-wide text-muted"
          >
            Como funciona
          </motion.h2>
          <div className="relative mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sunken text-sm font-bold text-primary ring-2 ring-primary/30">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-xs text-muted">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="h-16" />
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted">
          Plataforma destinada a maiores de 18 anos. Jogue com responsabilidade. Nao garantimos
          resultados ou lucro. Se precisar de ajuda, procure orientacao especializada.
        </p>
      </footer>
    </div>
  );
}
