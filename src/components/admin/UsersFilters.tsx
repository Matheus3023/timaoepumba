"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCESS_LEVEL_LABEL, ACCESS_LEVELS } from "@/components/admin/Badges";

const STATUS_OPTIONS = [
  { value: "", label: "Qualquer situação" },
  { value: "active", label: "Ativos" },
  { value: "restricted", label: "Restritos" },
  { value: "suspended", label: "Suspensos" },
  { value: "deleted", label: "Excluídos" },
];

const SIGNUP_PERIOD_OPTIONS = [
  { value: "", label: "Qualquer data" },
  { value: "7d", label: "Cadastro: 7 dias" },
  { value: "30d", label: "Cadastro: 30 dias" },
  { value: "90d", label: "Cadastro: 90 dias" },
];

export interface UsersFilterState {
  q: string;
  nivel: string;
  situacao: string;
  periodo: string;
  ordem: string;
}

/**
 * Filtros do CRM. Toda escolha vira parâmetro na URL e a consulta acontece
 * no servidor — o que mantém a lista compartilhável ("me manda o link dos
 * cadastros sem FTD dos últimos 7 dias") e evita trazer a base inteira para
 * o navegador só para filtrar.
 *
 * Mudar qualquer filtro volta para a página 1: manter a página 12 depois de
 * trocar o filtro é a forma mais rápida de fazer o admin achar que a busca
 * não retornou nada.
 */
export function UsersFilters({
  state,
  basePath = "/admin/usuarios",
  total,
}: {
  state: UsersFilterState;
  basePath?: string;
  total: number;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(state.q);

  const hasFilters = Boolean(state.q || state.nivel || state.situacao || state.periodo);

  function apply(patch: Partial<UsersFilterState>) {
    const next = { ...state, q: term, ...patch };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.nivel) params.set("nivel", next.nivel);
    if (next.situacao) params.set("situacao", next.situacao);
    if (next.periodo) params.set("periodo", next.periodo);
    if (next.ordem) params.set("ordem", next.ordem);
    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-surface/40 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply({});
          }}
          className="relative flex-1"
          role="search"
        >
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar por nome, e-mail ou Lead ID"
            aria-label="Buscar usuários"
            className="input w-full py-2.5 pl-9 text-sm"
          />
        </form>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
          <select
            value={state.nivel}
            onChange={(event) => apply({ nivel: event.target.value })}
            aria-label="Filtrar por etapa do funil"
            className="input py-2.5 text-sm"
          >
            <option value="">Todas as etapas</option>
            {ACCESS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {ACCESS_LEVEL_LABEL[level]}
              </option>
            ))}
          </select>

          <select
            value={state.situacao}
            onChange={(event) => apply({ situacao: event.target.value })}
            aria-label="Filtrar por situação da conta"
            className="input py-2.5 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={state.periodo}
            onChange={(event) => apply({ periodo: event.target.value })}
            aria-label="Filtrar por data de cadastro"
            className="input col-span-2 py-2.5 text-sm lg:col-span-1"
          >
            {SIGNUP_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tabular-nums text-muted">
          {total.toLocaleString("pt-BR")} {total === 1 ? "usuário encontrado" : "usuários encontrados"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              router.push(basePath);
            }}
            className="text-xs font-semibold text-secondary underline-offset-4 hover:text-body hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
