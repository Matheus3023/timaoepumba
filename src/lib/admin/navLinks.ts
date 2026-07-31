import type { AdminProfile, AdminSection } from "@/lib/admin/access";

export const ADMIN_NAV_LINKS: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/admin/usuarios", label: "Usuarios / CRM", section: "usuarios" },
  { href: "/admin/segmentos", label: "Segmentos", section: "segmentos" },
  { href: "/admin/analises", label: "Analises", section: "analises" },
  { href: "/admin/comunidade", label: "Moderacao", section: "comunidade" },
  { href: "/admin/dados-esportivos", label: "Dados esportivos", section: "dados_esportivos" },
  { href: "/admin/afiliados", label: "Casa parceira", section: "afiliados" },
  { href: "/admin/push", label: "Push", section: "push" },
  { href: "/admin/relatorios/retencao", label: "Retencao", section: "relatorios" },
  { href: "/admin/relatorios/comunicacoes", label: "Comunicacoes", section: "relatorios" },
  { href: "/admin/onboarding", label: "Onboarding", section: "onboarding" },
  { href: "/admin/auditoria", label: "Auditoria", section: "auditoria" },
  { href: "/admin/equipe", label: "Equipe", section: "equipe" },
];

export const ADMIN_PROFILE_LABEL: Record<AdminProfile, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  analista: "Midia/Analista",
  moderador: "Moderador",
  suporte: "Suporte",
  somente_leitura: "Somente leitura",
};
