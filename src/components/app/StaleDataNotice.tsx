/**
 * Aviso de dado desatualizado.
 *
 * Existe porque servir dado velho em silêncio é pior do que mostrar erro:
 * o placar de ontem parece o de hoje e a pessoa não tem como desconfiar.
 * Quando o provedor está fora e o app cai no último payload conhecido,
 * isto diz de quando ele é.
 *
 * Recebe a idade já formatada — ler o relógio é trabalho de quem busca o
 * dado, não do componente que o desenha.
 */
export function StaleDataNotice({ age, className = "" }: { age: string | null; className?: string }) {
  if (!age) return null;

  return (
    <p
      role="status"
      className={`mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-yellow-300 ${className}`}
    >
      <span aria-hidden>⚠️</span>
      Não consegui atualizar agora — estes dados são de {age} atrás.
    </p>
  );
}
