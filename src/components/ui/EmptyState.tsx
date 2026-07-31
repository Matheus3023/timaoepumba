import type { ReactNode } from "react";

/**
 * Standard empty-state block (redesign PRD sec. 22.2). Replaces two
 * near-identical local `EmptyState` definitions that existed in HomeView
 * and MatchDetailTabs (plain styled `<p>`, no icon/action) — the exact
 * "componentes visuais duplicados" defect the PRD calls out.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card flex flex-col items-center gap-1.5 py-8 text-center ${className}`}>
      {icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-neutral-200">{title}</p>
      {description && <p className="text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
