"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BallIcon, ChartIcon, ChatIcon, ShieldIcon } from "@/components/icons";
import { TeamAvatar } from "@/components/app/TeamAvatar";
import type { TickerMatch } from "@/lib/landing/ticker";

const FEATURES = [
  {
    icon: BallIcon,
    title: "Jogos ao vivo",
    description: "Placar, eventos e estatísticas em tempo real de todos os campeonatos que você acompanha.",
  },
  {
    icon: ChartIcon,
    title: "Análises de especialistas",
    description: "Conteúdo publicado por analistas de verdade, com mercado, risco e contexto — nunca automático.",
  },
  {
    icon: ChatIcon,
    title: "Comunidade ativa",
    description: "Salas por campeonato, enquetes, reações e resenha ao vivo com outros torcedores.",
  },
];

const STEPS = [
  { title: "Crie sua conta", description: "Leva menos de um minuto." },
  { title: "Cadastre-se na parceira", description: "Um clique gera seu link exclusivo." },
  { title: "Comunidade liberada", description: "Acesso às salas assim que confirmar." },
  { title: "Recursos completos", description: "Análises premium e salas exclusivas." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/**
 * Uma linha do ticker: escudo real do time, nome truncado e o placar
 * alinhado a direita. `tabular-nums` para o numero nao empurrar o layout
 * de lado quando o placar muda ao vivo.
 */
function TickerTeam({
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
    <div className="flex items-center gap-2">
      <TeamAvatar name={name} logoUrl={logo} size={18} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-white">{name}</span>
      {showScore && (
        <span className="shrink-0 text-[13px] font-bold tabular-nums text-white">{score ?? 0}</span>
      )}
    </div>
  );
}

export function LandingView({ matches }: { matches: TickerMatch[] }) {
  const liveCount = matches.filter((match) => match.live).length;

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
            alt="Timão e Pumba Tips"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-lg shadow-yellow-500/20"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Timão<span className="text-primary">&</span>Pumba
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
          Jogos, análises e comunidade em um só lugar
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl"
        >
          Viva o jogo com a <span className="text-gradient-gold">torcida</span>, não sozinho
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mt-4 max-w-md text-balance text-secondary"
        >
          Acompanhe partidas ao vivo, leia análises de quem entende e participe da comunidade
          Timão e Pumba — tudo dentro do app, direto no seu celular.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-8 flex w-full max-w-xs flex-col gap-3"
        >
          <Link href="/signup" className="btn-primary text-center text-[15px]">
            CRIAR CONTA GRÁTIS
          </Link>
          <Link href="/login" className="btn-secondary text-center">
            JÁ TENHO CONTA
          </Link>
        </motion.div>

        {/* Ticker com jogos reais — ver src/lib/landing/ticker.ts.
            Some por inteiro quando nao ha partida: uma faixa vazia diz
            menos que nenhuma faixa, e inventar jogo esta fora de questao. */}
        {matches.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            custom={4}
            variants={fadeUp}
            className="glass-panel mt-10 w-full max-w-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5 text-left">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-500" />
                {liveCount > 0 ? `${liveCount} ao vivo agora` : "Jogos de hoje"}
              </p>
              <span className="text-[10px] uppercase tracking-wide text-faint">dados reais</span>
            </div>

            <div className="scrollbar-none flex divide-x divide-white/5 overflow-x-auto">
              {matches.map((match) => (
                <div key={match.id} className="min-w-[210px] flex-1 px-4 py-3 text-left">
                  <p className="truncate text-[11px] text-muted">{match.league}</p>

                  <div className="mt-1.5 flex flex-col gap-1">
                    <TickerTeam
                      name={match.homeName}
                      logo={match.homeLogo}
                      score={match.homeScore}
                      showScore={match.live}
                    />
                    <TickerTeam
                      name={match.awayName}
                      logo={match.awayLogo}
                      score={match.awayScore}
                      showScore={match.live}
                    />
                  </div>

                  <p
                    className={`mt-1.5 text-[11px] font-semibold ${
                      match.live ? "text-primary" : "text-muted"
                    }`}
                  >
                    {match.live ? (
                      <>
                        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400 align-middle" />
                        {match.minute !== null ? `${match.minute}'` : "AO VIVO"}
                      </>
                    ) : (
                      match.kickoffLabel
                    )}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
          Plataforma destinada a maiores de 18 anos. Jogue com responsabilidade. Não garantimos
          resultados ou lucro. Se precisar de ajuda, procure orientação especializada.
        </p>
      </footer>
    </div>
  );
}
