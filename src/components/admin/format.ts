/**
 * Formatadores compartilhados pelas telas administrativas.
 *
 * Todos são chamados no servidor (RSC) e o resultado é passado como string
 * pronta para os componentes de cliente. Formatar dentro do componente de
 * cliente resolveria fuso horário e "agora" em momentos diferentes no
 * servidor e no navegador, o que gera divergência de hidratação em toda
 * linha de tabela que mostra data.
 */

/**
 * Fuso fixo de Brasília, e não o do ambiente: o servidor roda em UTC e o
 * navegador no fuso de quem abriu. Sem fixar, a mesma data renderiza
 * diferente nos dois lados (divergência de hidratação) e dois admins em
 * fusos diferentes discutem horários que não batem.
 */
const TIME_ZONE = "America/Sao_Paulo";

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: TIME_ZONE,
});

const NUMBER = new Intl.NumberFormat("pt-BR");

export const EMPTY = "—";

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY;
  return NUMBER.format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return DATE_TIME.format(date);
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return DATE_SHORT.format(date);
}

/**
 * Distância curta para colunas de tabela ("há 3 d"). Abaixo de um dia o
 * admin quer saber se a pessoa está online agora; acima de um mês a data
 * absoluta informa mais do que "há 47 d".
 *
 * Depende de `Date.now()`, então só deve ser chamada no servidor e passada
 * como string pronta: calculada nos dois lados da hidratação, devolveria
 * valores diferentes.
 */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return formatDateShort(value);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`;
  if (seconds < 2592000) return `há ${Math.floor(seconds / 86400)} d`;
  return formatDateShort(value);
}

/** Percentual de `part` sobre `total`, com traço quando não há base de cálculo. */
export function formatPercent(part: number, total: number, digits = 1): string {
  if (!total || total <= 0) return EMPTY;
  return `${((part / total) * 100).toFixed(digits).replace(".", ",")}%`;
}

/**
 * Variação percentual entre dois períodos. Devolve `null` quando o período
 * anterior é zero: "+∞%" não informa nada e "100%" seria mentira.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
