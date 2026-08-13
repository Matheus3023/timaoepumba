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
  | "competicoes"
  | "funil"
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
    competicoes: "write",
    funil: "write",
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
    competicoes: "write",
    funil: "write",
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
    competicoes: "none",
    funil: "none",
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
    competicoes: "none",
    funil: "none",
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
    competicoes: "read",
    funil: "read",
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
    "competicoes",
    "funil",
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

type Resolution =
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string }
  | { kind: "not_admin" }
  | { kind: "ok"; access: AdminAccess };

/**
 * Single source of truth for resolving admin access. Distinguishes three
 * failure modes that used to be conflated into one redirect (which made a
 * genuine backend error — e.g. a bad service-role key — look identical to
 * "you're just not an admin"):
 *  - unauthenticated: no logged-in user at all
 *  - error: the service-role lookup itself failed (real bug, not a
 *    permissions outcome)
 *  - not_admin: authenticated, lookup succeeded, access_level isn't ADMIN
 */
async function resolve(): Promise<Resolution> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) console.error("[admin/access] auth.getUser() failed", userError);
  if (!user) return { kind: "unauthenticated" };

  const admin = createAdminSupabaseClient();
  const [{ data: appUser, error: appUserError }, { data: userRole, error: userRoleError }] = await Promise.all([
    admin.from("users").select("full_name, access_level").eq("id", user.id).maybeSingle(),
    admin.from("user_roles").select("role_id").eq("user_id", user.id).limit(1).maybeSingle(),
  ]);

  if (appUserError) {
    console.error("[admin/access] users lookup failed", appUserError);
    return { kind: "error", message: `Falha ao consultar users (service role): ${appUserError.message}` };
  }
  if (userRoleError) {
    console.error("[admin/access] user_roles lookup failed", userRoleError);
    return { kind: "error", message: `Falha ao consultar user_roles (service role): ${userRoleError.message}` };
  }

  if (appUser?.access_level !== "ADMIN") return { kind: "not_admin" };

  let profile: AdminProfile | null = null;
  if (userRole?.role_id) {
    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("admin_profile")
      .eq("id", userRole.role_id)
      .maybeSingle();
    if (roleError) {
      console.error("[admin/access] roles lookup failed", roleError);
      return { kind: "error", message: `Falha ao consultar roles (service role): ${roleError.message}` };
    }
    profile = (role?.admin_profile as AdminProfile | null) ?? null;
  }

  return {
    kind: "ok",
    access: {
      adminId: user.id,
      adminName: appUser.full_name ?? "Admin",
      profile,
      isFullAccess: profile === null || profile === "administrador",
    },
  };
}

/**
 * Non-redirecting resolution for API route handlers, which need a JSON
 * error response rather than an HTTP redirect.
 */
export async function resolveAdminAccess(): Promise<AdminAccess | "unauthenticated" | "not_admin" | "error"> {
  const result = await resolve();
  if (result.kind === "ok") return result.access;
  return result.kind;
}

/**
 * Page/Server Action usage: redirects instead of returning a failure
 * status. Unauthenticated goes to /login, a genuine backend error goes to
 * /admin-erro with the real message (outside the /admin/* tree so it
 * isn't itself re-guarded by this same check), and authenticated-but-not-
 * admin goes to /home (matches the pre-RBAC behavior) — three different
 * destinations so a real bug in the ADMIN check is never mistaken for a
 * logged-out session or "you're just not an admin".
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const result = await resolve();
  if (result.kind === "unauthenticated") redirect("/acesso-interno");
  if (result.kind === "error") redirect(`/admin-erro?message=${encodeURIComponent(result.message)}`);
  if (result.kind === "not_admin") redirect("/home");
  return result.access;
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
