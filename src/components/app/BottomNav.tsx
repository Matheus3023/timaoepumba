"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BallIcon, ChartIcon, ChatIcon, HomeIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/home", label: "Inicio", icon: HomeIcon },
  { href: "/jogos", label: "Jogos", icon: BallIcon },
  { href: "/analises", label: "Analises", icon: ChartIcon },
  { href: "/comunidade", label: "Comunidade", icon: ChatIcon },
  { href: "/perfil", label: "Perfil", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-neutral-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl [-webkit-tap-highlight-color:transparent]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`relative flex touch-manipulation select-none flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-yellow-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-yellow-400"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon width={20} height={20} strokeWidth={active ? 2.1 : 1.8} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
