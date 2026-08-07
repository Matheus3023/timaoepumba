import type { ReactNode } from "react";

/**
 * Standard header for top-level screens (redesign PRD sec. 6.2's AppHeader,
 * scoped to the bottom-nav destinations — internal/detail screens use
 * BackButton directly since their header content is domain-specific).
 * Consolidates the title+description pattern that was hand-rolled with
 * slightly different markup on every top-level page.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && <p className="text-sm text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
