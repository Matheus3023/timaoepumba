"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminProfile, AdminSection } from "@/lib/admin/access";
import { ADMIN_NAV_LINKS, ADMIN_PROFILE_LABEL } from "@/lib/admin/navLinks";

/**
 * The desktop AdminSidebar is `hidden sm:block` — on a phone (including the
 * installed PWA) it never renders at all, so admin sections other than the
 * one you happened to link into were unreachable outside a desktop
 * browser. This gives phone-width admins a way to jump between sections.
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
  const current = links.find((link) => pathname.startsWith(link.href));

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
    <div className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-xl pt-[env(safe-area-inset-top)] sm:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav-menu"
        className="flex w-full items-center justify-between px-4 py-3 text-left touch-manipulation"
      >
        <span className="text-sm font-semibold text-white">{current?.label ?? "Admin"}</span>
        <span className="text-xs text-neutral-500">{open ? "Fechar ✕" : "Menu ☰"}</span>
      </button>

      {open && (
        <nav id="admin-mobile-nav-menu" className="flex flex-col gap-1 border-t border-neutral-800 px-3 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm ${
                pathname.startsWith(link.href) ? "bg-yellow-400/10 text-yellow-300" : "text-neutral-300 active:bg-neutral-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/home"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg border-t border-neutral-800 px-3 py-2.5 pt-3 text-sm text-neutral-500"
          >
            ← Voltar ao aplicativo
          </Link>
          <div className="px-3 pt-1">
            <p className="text-xs text-neutral-400">{adminName}</p>
            <p className="text-[11px] text-neutral-600">{profile ? ADMIN_PROFILE_LABEL[profile] : "Administrador (padrao)"}</p>
          </div>
        </nav>
      )}
    </div>
  );
}
