"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminProfile, AdminSection } from "@/lib/admin/access";
import { ADMIN_NAV_LINKS, ADMIN_PROFILE_LABEL } from "@/lib/admin/navLinks";
import { groupAdminNavLinks, isNavLinkActive } from "@/components/admin/navGroups";

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
  const groups = groupAdminNavLinks(ADMIN_NAV_LINKS.filter((link) => allowedSections.has(link.section)));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/[0.06] bg-sunken sm:sticky sm:top-0 sm:block sm:h-dvh sm:overflow-y-auto">
      <div className="flex min-h-full flex-col px-3 py-5">
        <Link href="/admin/dashboard" className="mb-5 flex items-center gap-2.5 px-2">
          <span className="h-7 w-[3px] rounded-full bg-primary" />
          <span>
            <span className="block text-[13px] font-bold leading-tight text-white">Timão e Pumba</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Painel administrativo
            </span>
          </span>
        </Link>

        <nav className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                {group.label}
              </p>
              <div className="flex flex-col">
                {group.links.map((link) => {
                  const active = isNavLinkActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-[13px] transition-colors ${
                        active ? "bg-primary/10 font-semibold text-primary" : "text-secondary hover:bg-surface hover:text-body"
                      }`}
                    >
                      <span
                        className={`h-3.5 w-[2px] shrink-0 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
                      />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <p className="px-2 text-xs font-medium text-body">{adminName}</p>
          <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-faint">
            {profile ? ADMIN_PROFILE_LABEL[profile] : "Acesso total"}
          </p>
          <Link
            href="/home"
            className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-body"
          >
            <span aria-hidden>&larr;</span> Voltar ao aplicativo
          </Link>
        </div>
      </div>
    </aside>
  );
}
