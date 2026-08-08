import Image from "next/image";
import Link from "next/link";
import { BallIcon, ChartIcon, ChatIcon } from "@/components/icons";

/**
 * Moldura das telas de entrada (login, cadastro, recuperacao de senha).
 *
 * Server Component: era client so para animar a entrada do formulario com
 * framer-motion, o que colocava o campo de e-mail em opacity 0 ate o JS
 * hidratar. Na porta de entrada do produto isso e caro duas vezes, atrasa o
 * maior elemento da tela e atrasa o primeiro toque de quem ja chegou
 * decidido a entrar. Os formularios continuam client, cada um no seu
 * arquivo.
 *
 * Mesma linguagem da landing: faixas de gramado no lugar das bolas de luz
 * borradas, rotulos em mono, fio de 1px em vez de vidro fosco.
 */

const HIGHLIGHTS = [
  { icon: BallIcon, text: "Jogos ao vivo com estatísticas em tempo real" },
  { icon: ChartIcon, text: "Análises publicadas por especialistas de verdade" },
  { icon: ChatIcon, text: "Comunidade com salas por campeonato" },
];

const PITCH_STRIPES =
  "repeating-linear-gradient(97deg, rgba(255,255,255,0.022) 0 46px, transparent 46px 92px)";

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Timão e Pumba Tips, início">
      <Image
        src="/icons/icon-512.png"
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] rounded-lg"
        priority
      />
      <span className="text-[17px] font-extrabold tracking-tight text-white">
        Timão<span className="text-primary">&</span>Pumba
      </span>
    </Link>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#080b09]">
      {/* Painel de apoio, so no desktop. No celular ele nao existe, nem no
          HTML: quem entra pelo telefone recebe direto o formulario. */}
      <aside className="relative hidden w-[42%] max-w-lg flex-col justify-between border-r border-white/[0.06] p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
          style={{ backgroundImage: PITCH_STRIPES }}
        />

        <Wordmark className="relative" />

        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Timão e Pumba Tips
          </p>
          <h2 className="mt-4 max-w-sm text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
            Viva o jogo com a <span className="text-primary">torcida</span>
          </h2>

          <ul className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-center gap-3 py-3.5">
                <item.icon width={17} height={17} className="shrink-0 text-primary" aria-hidden />
                <p className="text-sm leading-relaxed text-body">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          18+ · Jogue com responsabilidade
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/[0.05] px-5 py-3.5 sm:px-8 lg:hidden">
          <Wordmark />
        </header>

        <main className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>

        <footer className="px-5 pb-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-md flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.05] pt-5 text-[11px] text-faint">
            <span className="font-mono uppercase tracking-[0.14em]">18+</span>
            <Link href="/termos" className="hover:text-secondary">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-secondary">
              Política de Privacidade
            </Link>
            <p className="w-full leading-relaxed">
              Conteúdo informativo, sem garantia de resultado. Jogue com responsabilidade.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
