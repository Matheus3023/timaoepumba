import type { ReactNode } from "react";

/**
 * Bloco de conteúdo do painel. Mais seco que o `.card` do aplicativo (sem
 * gradiente nem blur): em tela de trabalho, o contorno de 1px basta para
 * separar assunto e devolve altura útil para os dados.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-white/[0.06] bg-surface/40 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-strong">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Classe do cabeçalho de tabela, repetida em cinco telas do painel. */
export const TABLE_HEAD_CLASS =
  "sticky top-0 z-10 bg-sunken/95 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint backdrop-blur";

/**
 * Moldura de tabela com rolagem horizontal contida. O `minWidth` é
 * obrigatório de propósito: tabela sem largura mínima colapsa as colunas em
 * telas médias e vira um bloco ilegível em vez de rolar.
 */
export function TableShell({
  children,
  minWidth = 760,
  className = "",
}: {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
