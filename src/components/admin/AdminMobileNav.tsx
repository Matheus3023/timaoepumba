"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminProfile, AdminSection } from "@/lib/admin/access";
import { ADMIN_NAV_LINKS, ADMIN_PROFILE_LABEL } from "@/lib/admin/navLinks";
import { groupAdminNavLinks, isNavLinkActive } from "@/components/admin/navGroups";

/**
 * A AdminSidebar do desktop é `hidden sm:block` — no celular (incluindo o
 * PWA instalado) ela nunca renderiza, então as seções ficariam inalcançáveis
 * fora do navegador de mesa. Aqui os mesmos grupos da barra lateral viram um
 * menu recolhível, para o admin não perder a noção de onde cada tela mora
 * quando troca de aparelho.
 */
export function AdminMobileNav({
  adminName,
  profile,
  allowedSections,
}: {
  adminName: string;
  profile: AdminProfile | null;
  allowedSections: Set<AdminSection>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = ADMIN_NAV_LINKS.filter((link) => allowedSections.has(link.section));
  const groups = groupAdminNavLinks(links);
  const current = links.find((link) => isNavLinkActive(pathname, link.href));

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-sunken/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav-menu"
        className="flex w-full touch-manipulation items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="h-5 w-[3px] shrink-0 rounded-full bg-primary" />
          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Painel</span>
            <span className="block truncate text-sm font-semibold text-white">{current?.label ?? "Administrativo"}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary">
          {open ? "Fechar" : "Seções"}
        </span>
      </button>

      {open && (
        <nav
          id="admin-mobile-nav-menu"
          className="max-h-[70dvh] overflow-y-auto border-t border-white/[0.06] px-3 pb-3 pt-2"
        >
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                {group.label}
              </p>
              {group.links.map((link) => {
                const active = isNavLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm ${
                      active ? "bg-primary/10 font-semibold text-primary" : "text-body active:bg-surface"
                    }`}
                  >
                    <span className={`h-4 w-[2px] shrink-0 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="border-t border-white/[0.06] px-2 pt-3">
            <p className="text-xs font-medium text-body">{adminName}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-faint">
              {profile ? ADMIN_PROFILE_LABEL[profile] : "Acesso total"}
            </p>
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-11 items-center gap-1.5 text-sm text-muted"
            >
              <span aria-hidden>&larr;</span> Voltar ao aplicativo
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
