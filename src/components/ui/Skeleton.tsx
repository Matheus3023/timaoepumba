/**
 * Base pulsing placeholder block (redesign PRD sec. 22.1). Loading states
 * should be shaped like the real content, not a lone spinner — compose
 * this into layouts that mirror the final card/list (see app/(app)/jogos
 * and app/(app)/home loading.tsx for examples).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-elevated/80 ${className}`} />;
}
