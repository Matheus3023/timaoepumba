"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BallIcon, ChartIcon, ChatIcon } from "@/components/icons";

const HIGHLIGHTS = [
  { icon: BallIcon, text: "Jogos ao vivo com estatisticas em tempo real" },
  { icon: ChartIcon, text: "Analises publicadas por especialistas de verdade" },
  { icon: ChatIcon, text: "Comunidade com salas por campeonato" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-[#080b09]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 animate-float-slow rounded-full bg-emerald-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-float-slower rounded-full bg-yellow-400/10 blur-[110px]" />

      {/* Decorative side panel — desktop only */}
      <div className="relative z-10 hidden w-[42%] flex-col justify-between border-r border-white/5 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/icon-512.png"
            alt="Timao e Pumba Tips"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl shadow-lg shadow-yellow-500/20"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Timao<span className="text-yellow-400">&</span>Pumba
          </span>
        </Link>

        <div>
          <h2 className="max-w-sm text-3xl font-extrabold leading-tight text-white">
            Viva o jogo com a <span className="text-gradient-gold">torcida</span>
          </h2>
          <div className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-yellow-400">
                  <item.icon width={17} height={17} />
                </div>
                <p className="text-sm text-neutral-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-600">Uso exclusivo para maiores de 18 anos.</p>
      </div>

      {/* Form panel */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/icons/icon-512.png" alt="Timao e Pumba Tips" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="font-extrabold tracking-tight text-white">
              Timao<span className="text-yellow-400">&</span>Pumba
            </span>
          </Link>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
