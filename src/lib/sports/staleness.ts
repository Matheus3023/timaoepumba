/**
 * Idade legível de um payload vencido.
 *
 * Vive fora do componente porque ler o relógio é efeito, não render: um
 * componente que chama `Date.now()` durante a renderização produz saída
 * diferente a cada re-render sem que nada tenha mudado.
 */
export function formatStaleAge(staleSince: string | null, now: number = Date.now()): string | null {
  if (!staleSince) return null;

  const minutes = Math.max(1, Math.round((now - new Date(staleSince).getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
}
