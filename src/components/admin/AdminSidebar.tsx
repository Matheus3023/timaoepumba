"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuarios / CRM" },
  { href: "/admin/analises", label: "Analises" },
  { href: "/admin/afiliados", label: "Casa parceira" },
  { href: "/admin/push", label: "Push" },
  { href: "/admin/onboarding", label: "Onboarding" },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 px-4 py-6 sm:block">
      <p className="mb-6 text-sm font-bold text-white">Timao e Pumba — Admin</p>
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              pathname.startsWith(link.href)
                ? "bg-yellow-400/10 text-yellow-300"
                : "text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-8 text-xs text-neutral-600">{adminName}</p>
    </aside>
  );
}
