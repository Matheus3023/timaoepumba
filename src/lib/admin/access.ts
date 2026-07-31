import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/** Mirrors the `admin_profile` Postgres enum (supabase/migrations/0001_core_schema.sql). */
export type AdminProfile = "administrador" | "gestor" | "analista" | "moderador" | "suporte" | "somente_leitura";

export type AdminSection =
  | "dashboard"
  | "usuarios"
  | "analises"
  | "comunidade"
  | "dados_esportivos"
  | "afiliados"
  | "push"
  | "segmentos"
  | "onboarding"
  | "relatorios"
  | "auditoria"
  | "equipe";

type SectionAccess = "none" | "read" | "write";

/**
 * Permission matrix per PRD sec. 36. `administrador` and admins with no
 * assigned profile yet (see getAdminAccess) get full write access to every
 * section — the profile system narrows access, it never locks out an admin
 * who hasn't been explicitly assigned a restricted profile.
 */
const MATRIX: Record<Exclude<AdminProfile, "administrador">, Record<AdminSection, SectionAccess>> = {
  gestor: {
    dashboard: "write",
    usuarios: "write",
    analises: "write",
    comunidade: "write",
    dados_esportivos: "write",
    afiliados: "write",
    push: "write",
    segmentos: "write",
    onboarding: "write",
    relatorios: "write",
    auditoria: "read",
    equipe: "none",
  },
  // Covers both "Midia" and "Analista esportivo" from the PRD — the
  // seeded roles table maps both to this single admin_profile value today.
  analista: {
    dashboard: "read",
    usuarios: "read",
    analises: "write",
    comunidade: "none",
    dados_esportivos: "write",
    afiliados: "none",
    push: "write",
    segmentos: "read",
    onboarding: "none",
    relatorios: "read",
    auditoria: "none",
    equipe: "none",
  },
  moderador: {
    dashboard: "none",
    usuarios: "none",
    analises: "none",
    comunidade: "write",
    dados_esportivos: "none",
    afiliados: "none",
    push: "none",
    segmentos: "none",
    onboarding: "none",
    relatorios: "none",
    auditoria: "none",
    equipe: "none",
  },
  suporte: {
    dashboard: "none",
    usuarios: "write",
    analises: "none",
    comunidade: "read",
    dados_esportivos: "none",
    afiliados: "none",
    push: "none",
    segmentos: "none",
    onboarding: "none",
    relatorios: "none",
    auditoria: "none",
    equipe: "none",
  },
  somente_leitura: {
    dashboard: "read",
    usuarios: "read",
    analises: "read",
    comunidade: "read",
    dados_esportivos: "read",
    afiliados: "read",
    push: "read",
    segmentos: "read",
    onboarding: "read",
    relatorios: "read",
    auditoria: "read",
    equipe: "none",
  },
};

export interface AdminAccess {
  adminId: string;
  adminName: string;
  profile: AdminProfile | null;
  /** True for `administrador` and for admins with no profile assigned yet (bootstrap default). */
  isFullAccess: boolean;
}

function sectionAccess(access: AdminAccess, section: AdminSection): SectionAccess {
  if (access.isFullAccess) return "write";
  return MATRIX[access.profile as Exclude<AdminProfile, "administrador">][section];
}

export function canRead(access: AdminAccess, section: AdminSection): boolean {
  return sectionAccess(access, section) !== "none";
}

export function canWrite(access: AdminAccess, section: AdminSection): boolean {
  return sectionAccess(access, section) === "write";
}

export function allowedSections(access: AdminAccess): Set<AdminSection> {
  const all: AdminSection[] = [
    "dashboard",
    "usuarios",
    "analises",
    "comunidade",
    "dados_esportivos",
    "afiliados",
    "push",
    "segmentos",
    "onboarding",
    "relatorios",
    "auditoria",
    "equipe",
  ];
  return new Set(all.filter((section) => canRead(access, section)));
}

/**
 * Resolves the current admin's profile, or null if the caller isn't an
 * authenticated ADMIN. Never redirects — safe to use from API route
 * handlers, which need a JSON error response rather than an HTTP redirect.
 * An admin with no row in `user_roles` yet is treated as full-access
 * (isFullAccess=true) so existing admin accounts aren't locked out the
 * moment this feature ships — narrowing access requires explicitly
 * assigning a profile in /admin/equipe.
 */
export async function resolveAdminAccess(): Promise<AdminAccess | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminSupabaseClient();
  const [{ data: appUser }, { data: userRole }] = await Promise.all([
    admin.from("users").select("full_name, access_level").eq("id", user.id).maybeSingle(),
    admin.from("user_roles").select("role_id").eq("user_id", user.id).limit(1).maybeSingle(),
  ]);

  if (appUser?.access_level !== "ADMIN") return null;

  let profile: AdminProfile | null = null;
  if (userRole?.role_id) {
    const { data: role } = await admin.from("roles").select("admin_profile").eq("id", userRole.role_id).maybeSingle();
    profile = (role?.admin_profile as AdminProfile | null) ?? null;
  }

  return {
    adminId: user.id,
    adminName: appUser.full_name ?? "Admin",
    profile,
    isFullAccess: profile === null || profile === "administrador",
  };
}

/** Page/Server Action usage: redirects (rather than returning null) when the caller isn't an admin. */
export async function getAdminAccess(): Promise<AdminAccess> {
  const access = await resolveAdminAccess();
  if (!access) redirect("/login");
  return access;
}

/**
 * Guards a page: redirects out of /admin if the current admin can't at
 * least read this section. Redirects to /home (not another /admin/* page)
 * to avoid loops — a profile denied one section may also be denied
 * whatever page we'd otherwise send it to.
 */
export async function requireAdminSection(section: AdminSection): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!canRead(access, section)) redirect("/home");
  return access;
}
