import type { AccessLevel } from "@/types/database";

export const ACCESS_LEVEL_LABEL: Record<string, string> = {
  VISITOR: "Visitante",
  APP_USER: "Conta criada",
  REGISTERED_USER: "Cadastro confirmado",
  FTD_USER: "FTD confirmado",
  RESTRICTED_USER: "Restrito",
  ADMIN: "Administrador",
};

/** Rótulo curto para caber em coluna de tabela sem quebrar linha. */
export const ACCESS_LEVEL_SHORT: Record<string, string> = {
  VISITOR: "Visitante",
  APP_USER: "Conta",
  REGISTERED_USER: "Cadastro",
  FTD_USER: "FTD",
  RESTRICTED_USER: "Restrito",
  ADMIN: "Admin",
};

export const ACCESS_LEVELS: AccessLevel[] = [
  "VISITOR",
  "APP_USER",
  "REGISTERED_USER",
  "FTD_USER",
  "RESTRICTED_USER",
  "ADMIN",
];

/**
 * A cor carrega o estágio no funil, não a categoria: cinza é quem ainda não
 * andou, âmbar é quem está no meio do caminho, verde é quem converteu e
 * vermelho é problema. Amarelo da marca fica reservado para ADMIN, que é
 * conta de casa, não lead.
 */
const ACCESS_LEVEL_CLASS: Record<string, string> = {
  VISITOR: "bg-surface-elevated text-muted",
  APP_USER: "bg-surface-elevated text-body",
  REGISTERED_USER: "bg-warning-soft text-warning",
  FTD_USER: "bg-success-soft text-success",
  RESTRICTED_USER: "bg-error-soft text-error",
  ADMIN: "bg-primary-soft text-primary",
};

export function AccessLevelBadge({ level, short = false }: { level: string; short?: boolean }) {
  const label = (short ? ACCESS_LEVEL_SHORT : ACCESS_LEVEL_LABEL)[level] ?? level;
  return <span className={`badge ${ACCESS_LEVEL_CLASS[level] ?? "bg-surface-elevated text-body"}`}>{label}</span>;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  restricted: "Restrito",
  suspended: "Suspenso",
  deleted: "Excluído",
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-surface-elevated text-body",
  restricted: "bg-error-soft text-error",
  suspended: "bg-error-soft text-error",
  deleted: "bg-surface-elevated text-muted",
};

export function UserStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_CLASS[status] ?? "bg-surface-elevated text-body"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function scoreClass(total: number): string {
  if (total >= 80) return "bg-success-soft text-success";
  if (total >= 60) return "bg-warning-soft text-warning";
  if (total >= 40) return "bg-surface-highlighted/40 text-body";
  return "bg-surface-elevated text-muted";
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="font-mono text-xs text-faint">—</span>;
  }
  return <span className={`badge tabular-nums ${scoreClass(score)}`}>{score}</span>;
}
