"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";

/**
 * Standard back-navigation control (redesign PRD sec. "Botao de voltar").
 * Prefers real browser/App Router history — `window.history.length > 1`
 * means this tab actually has somewhere to go back to (a fresh direct
 * load, deep link, or a page opened from a push notification has none) —
 * falling back to a fixed route instead of always landing on Home.
 */
export function BackButton({
  fallbackHref,
  label = "Voltar",
  className = "",
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex min-h-11 items-center gap-1.5 text-sm text-neutral-400 transition hover:text-neutral-200 ${className}`}
    >
      <ArrowLeftIcon width={16} height={16} />
      {label}
    </button>
  );
}
