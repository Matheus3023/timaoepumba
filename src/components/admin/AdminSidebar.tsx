"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminProfile, AdminSection } from "@/lib/admin/access";

const LINKS: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/admin/usuarios", label: "Usuarios / CRM", section: "usuarios" },
  { href: "/admin/segmentos", label: "Segmentos", section: "segmentos" },
  { href: "/admin/analises", label: "Analises", section: "analises" },
  { href: "/admin/comunidade", label: "Moderacao", section: "comunidade" },
  { href: "/admin/dados-esportivos", label: "Dados esportivos", section: "dados_esportivos" },
  { href: "/admin/afiliados", label: "Casa parceira", section: "afiliados" },
  { href: "/admin/push", label: "Push", section: "push" },
  { href: "/admin/onboarding", label: "Onboarding", section: "onboarding" },
  { href: "/admin/auditoria", label: "Auditoria", section: "auditoria" },
  { href: "/admin/equipe", label: "Equipe", section: "equipe" },
];

const PROFILE_LABEL: Record<AdminProfile, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  analista: "Midia/Analista",
  moderador: "Moderador",
  suporte: "Suporte",
  somente_leitura: "Somente leitura",
};

export function AdminSidebar({
  adminName,
  profile,
  allowedSections,
}: {
  adminName: string;
  profile: AdminProfile | null;
  allowedSections: Set<AdminSection>;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => allowedSections.has(link.section));

  return (
    <aside className="hidden w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 px-4 py-6 sm:block">
      <p className="mb-6 text-sm font-bold text-white">Timao e Pumba — Admin</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
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
      <div className="mt-8">
        <p className="text-xs text-neutral-300">{adminName}</p>
        <p className="text-[11px] text-neutral-600">{profile ? PROFILE_LABEL[profile] : "Administrador (padrao)"}</p>
      </div>
    </aside>
  );
}
