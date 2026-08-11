import type { ReactNode } from "react";

/**
 * Standard header for top-level screens (redesign PRD sec. 6.2's AppHeader,
 * scoped to the bottom-nav destinations — internal/detail screens use
 * BackButton directly since their header content is domain-specific).
 * Consolidates the title+description pattern that was hand-rolled with
 * slightly different markup on every top-level page.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  /** Rótulo de contexto acima do título. Renderiza a régua da marca (traço no
   *  acento + condensado maiúsculo) descrita no DESIGN.md. */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="hud-label mb-1.5">{eyebrow}</p>}
        {/* Maiúscula com tracking levemente aberto: é o condensado de placar
            de transmissão, não título de blog. O h1 já herda a família
            display do globals.css. */}
        <h1 className="text-[1.375rem] uppercase leading-none tracking-[0.01em] text-strong">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
