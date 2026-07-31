"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminProfile, AdminSection } from "@/lib/admin/access";
import { ADMIN_NAV_LINKS, ADMIN_PROFILE_LABEL } from "@/lib/admin/navLinks";

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
  const links = ADMIN_NAV_LINKS.filter((link) => allowedSections.has(link.section));

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
        <p className="text-[11px] text-neutral-600">{profile ? ADMIN_PROFILE_LABEL[profile] : "Administrador (padrao)"}</p>
      </div>
    </aside>
  );
}
