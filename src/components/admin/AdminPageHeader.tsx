import type { ReactNode } from "react";

/**
 * Cabeçalho padrão das telas do painel. Diferente do PageHeader do
 * aplicativo do torcedor: aqui existe uma linha de contexto (a que grupo a
 * tela pertence) porque o admin navega entre quinze telas parecidas e
 * precisa saber onde está sem voltar os olhos para a barra lateral.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-[var(--hud-rule)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="hud-label">{eyebrow}</p>}
        <h1 className="mt-1.5 text-[1.375rem] uppercase leading-none tracking-[0.01em] text-strong">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
