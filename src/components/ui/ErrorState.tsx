/**
 * Standard error block (redesign PRD sec. 22.3): understandable message,
 * retry action, no stack traces or technical codes shown to the user —
 * those belong in server logs only.
 */
export function ErrorState({
  title = "Algo deu errado",
  description = "Nao foi possivel carregar essas informacoes.",
  onRetry,
  className = "",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`card flex flex-col items-center gap-1.5 py-8 text-center ${className}`}>
      <p className="text-sm font-semibold text-red-300">{title}</p>
      <p className="text-sm text-muted">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2 px-4 py-2 text-sm">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
