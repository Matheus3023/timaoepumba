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
    <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{eyebrow}</p>
        )}
        <h1 className="mt-0.5 text-[22px] font-bold leading-tight text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
