/**
 * Corte de data para os filtros de período do painel.
 *
 * Vive fora das telas porque ler o relógio é efeito, não render: chamar
 * `Date.now()` no corpo de um componente é impuro, e o lint do React
 * reprova com razão — a mesma renderização passaria a produzir um recorte
 * diferente a cada execução.
 */
export function sinceDaysAgo(days: number, now: number = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}
