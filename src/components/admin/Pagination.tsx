import Link from "next/link";
import { formatNumber } from "@/components/admin/format";

/**
 * Paginação por link (sem estado de cliente): mantém a tela como Server
 * Component, deixa o resultado compartilhável por URL e sobrevive ao
 * recarregar. Mostra o intervalo real ("26–50 de 4.312") porque o admin
 * precisa saber o tamanho da base, não só que existe um "próximo".
 */
export function Pagination({
  page,
  pageSize,
  total,
  hrefForPage,
  label = "registros",
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
  label?: string;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="font-mono text-[11px] tabular-nums text-muted">
        {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)} {label}
      </p>

      <div className="flex items-center gap-1.5">
        <PageLink href={hrefForPage(1)} disabled={page <= 1} label="Primeira página">
          &laquo;
        </PageLink>
        <PageLink href={hrefForPage(page - 1)} disabled={page <= 1} label="Página anterior">
          &lsaquo;
        </PageLink>
        <span className="px-2 font-mono text-[11px] tabular-nums text-secondary">
          {page} / {lastPage}
        </span>
        <PageLink href={hrefForPage(page + 1)} disabled={page >= lastPage} label="Próxima página">
          &rsaquo;
        </PageLink>
        <PageLink href={hrefForPage(lastPage)} disabled={page >= lastPage} label="Última página">
          &raquo;
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-none border px-2 text-sm transition-colors";

  if (disabled) {
    return (
      <span aria-disabled className={`${base} border-white/[0.04] text-faint`}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={`${base} border-white/[0.08] text-body hover:border-white/20 hover:bg-surface`}>
      {children}
    </Link>
  );
}
