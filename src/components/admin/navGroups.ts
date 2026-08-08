import { ADMIN_NAV_LINKS } from "@/lib/admin/navLinks";

type NavLink = (typeof ADMIN_NAV_LINKS)[number];

/**
 * Agrupamento da navegação do painel. Quinze links numa lista plana obrigam
 * o admin a ler tudo toda vez; agrupados por natureza da tarefa (olhar
 * número / cuidar de gente / publicar / operar / administrar o sistema) a
 * varredura vira reconhecimento de bloco.
 *
 * O agrupamento vive aqui, e não em `src/lib/admin/navLinks.ts`, para não
 * mexer no contrato de permissão (`section`) que a matriz de acesso usa —
 * grupo é decisão de interface, seção é decisão de permissão.
 */
const GROUP_BY_HREF: Record<string, string> = {
  "/admin/dashboard": "Visão geral",
  "/admin/relatorios/retencao": "Visão geral",
  "/admin/relatorios/comunicacoes": "Visão geral",

  "/admin/usuarios": "Pessoas",
  "/admin/segmentos": "Pessoas",

  "/admin/analises": "Conteúdo",
  "/admin/comunidade": "Conteúdo",

  "/admin/funil": "Operação",
  "/admin/push": "Operação",
  "/admin/afiliados": "Operação",
  "/admin/dados-esportivos": "Operação",
  "/admin/competicoes": "Operação",
  "/admin/onboarding": "Operação",

  "/admin/auditoria": "Sistema",
  "/admin/equipe": "Sistema",
};

const GROUP_ORDER = ["Visão geral", "Pessoas", "Conteúdo", "Operação", "Sistema"] as const;

/** Link novo que ainda não foi classificado cai aqui em vez de sumir da navegação. */
const FALLBACK_GROUP = "Operação";

export interface AdminNavGroup {
  label: string;
  links: NavLink[];
}

export function groupAdminNavLinks(links: NavLink[]): AdminNavGroup[] {
  return GROUP_ORDER.map((label) => ({
    label,
    links: links.filter((link) => (GROUP_BY_HREF[link.href] ?? FALLBACK_GROUP) === label),
  })).filter((group) => group.links.length > 0);
}

/**
 * Um link só fica ativo pelo prefixo quando não existe irmão mais
 * específico — sem isso `/admin/relatorios/retencao` e
 * `/admin/relatorios/comunicacoes` acenderiam juntos em telas filhas.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
