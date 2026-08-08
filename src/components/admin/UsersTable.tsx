"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { AccessLevelBadge, ScoreBadge, UserStatusBadge } from "@/components/admin/Badges";
import { TABLE_HEAD_CLASS, TableShell } from "@/components/admin/Panel";

export interface UserRowView {
  id: string;
  name: string;
  email: string;
  leadId: string;
  accessLevel: string;
  status: string;
  score: number | null;
  origin: string;
  originTitle: string;
  lastSeen: string;
  lastSeenTitle: string;
  createdAt: string;
  createdAtTitle: string;
}

export type UsersSortColumn = "nome" | "nivel" | "cadastro" | "score";

/**
 * Lista do CRM. Em tela larga é tabela (o admin compara linhas), no celular
 * são cartões — tabela de sete colunas com rolagem horizontal no telefone é
 * o pior dos dois mundos: nem cabe nem dá para comparar.
 *
 * A seleção é estado de cliente, mas o envio é formulário nativo: as caixas
 * são `<input name="user_ids">` dentro do form da Server Action, então o
 * estado local serve só para a barra de ação aparecer e contar. Se o
 * JavaScript falhar, marcar e enviar continua funcionando.
 */
export function UsersTable({
  rows,
  writable,
  bulkAction,
  sortHref,
  activeSort,
  ascending,
}: {
  rows: UserRowView[];
  writable: boolean;
  bulkAction: (formData: FormData) => void;
  sortHref: Record<UsersSortColumn, string>;
  activeSort: UsersSortColumn | null;
  ascending: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = rows.length > 0 && selected.length === rows.length;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)));
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map((row) => row.id) : []);
  }

  const headerProps = { sortHref, activeSort, ascending };

  return (
    <form action={bulkAction}>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface/40">
        {/* Tabela: telas médias para cima */}
        <div className="hidden md:block">
          <TableShell minWidth={880}>
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                {writable && (
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="Selecionar todos desta página"
                      className="h-4 w-4 accent-primary"
                    />
                  </th>
                )}
                <SortableHead column="nome" label="Usuário" {...headerProps} />
                <SortableHead column="nivel" label="Etapa" {...headerProps} />
                <SortableHead column="score" label="Score" align="right" {...headerProps} />
                <th scope="col" className="px-3 py-2.5">
                  Origem
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Último acesso
                </th>
                <SortableHead column="cadastro" label="Cadastro" {...headerProps} align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                  {writable && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        name="user_ids"
                        value={row.id}
                        checked={selected.includes(row.id)}
                        onChange={(event) => toggle(row.id, event.target.checked)}
                        aria-label={`Selecionar ${row.name}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <Link href={`/admin/usuarios/${row.id}`} className="flex items-center gap-2.5">
                      <Avatar name={row.name} size={30} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-strong">{row.name}</span>
                        <span className="block truncate text-xs text-muted">{row.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-1">
                      <AccessLevelBadge level={row.accessLevel} short />
                      {row.status !== "active" && <UserStatusBadge status={row.status} />}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <ScoreBadge score={row.score} />
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-xs text-secondary" title={row.originTitle}>
                    {row.origin}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-secondary" title={row.lastSeenTitle}>
                    {row.lastSeen}
                  </td>
                  <td
                    className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs tabular-nums text-muted"
                    title={row.createdAtTitle}
                  >
                    {row.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>

        {/* Cartões: celular */}
        <ul className="divide-y divide-white/[0.04] md:hidden">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 px-3 py-3">
              {writable && (
                <input
                  type="checkbox"
                  name="user_ids"
                  value={row.id}
                  checked={selected.includes(row.id)}
                  onChange={(event) => toggle(row.id, event.target.checked)}
                  aria-label={`Selecionar ${row.name}`}
                  className="mt-1 h-5 w-5 shrink-0 accent-primary"
                />
              )}
              <Link href={`/admin/usuarios/${row.id}`} className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={row.name} size={34} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-strong">{row.name}</p>
                      <p className="truncate text-xs text-muted">{row.email}</p>
                    </div>
                  </div>
                  <ScoreBadge score={row.score} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <AccessLevelBadge level={row.accessLevel} short />
                  {row.status !== "active" && <UserStatusBadge status={row.status} />}
                  <span className="font-mono text-[11px] text-faint">
                    acesso {row.lastSeen} · cadastro {row.createdAt}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {writable && selected.length > 0 && (
        <div className="sticky bottom-3 z-20 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-sunken/95 px-4 py-3 backdrop-blur">
          <p className="text-sm text-body">
            <span className="font-semibold tabular-nums text-primary">{selected.length}</span>{" "}
            {selected.length === 1 ? "usuário selecionado" : "usuários selecionados"}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected([])} className="btn-secondary px-3 py-2 text-xs">
              Limpar seleção
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-xs">
              Recalcular score
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

function SortableHead({
  column,
  label,
  sortHref,
  activeSort,
  ascending,
  align = "left",
}: {
  column: UsersSortColumn;
  label: string;
  sortHref: Record<UsersSortColumn, string>;
  activeSort: UsersSortColumn | null;
  ascending: boolean;
  align?: "left" | "right";
}) {
  const active = activeSort === column;

  return (
    <th
      scope="col"
      aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}
      className={`px-3 py-2.5 ${align === "right" ? "text-right" : ""}`}
    >
      <Link
        href={sortHref[column]}
        className={`inline-flex items-center gap-1 transition-colors hover:text-body ${active ? "text-primary" : ""}`}
      >
        {label}
        <span aria-hidden className={active ? "" : "text-transparent"}>
          {active && !ascending ? "▼" : "▲"}
        </span>
      </Link>
    </th>
  );
}
