"use client";

import { useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { useOverlayA11y } from "./useOverlayA11y";

/**
 * Accessible modal primitive (redesign PRD sec. "Modais, pop-ups e bottom
 * sheets"). Every instance gets, for free: Escape to close, focus trapped
 * inside while open, focus restored to whatever opened it, background
 * scroll locked, and a labeled close button — none of which existed
 * anywhere in the codebase before this (no overlay in the project handled
 * Escape or focus trapping).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnOverlayClick = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Set to false for flows where an accidental outside click could lose
   * unsaved input — the PRD explicitly calls this out as the one case
   * where click-outside-to-close should be disabled. */
  closeOnOverlayClick?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useOverlayA11y({ open, onClose, containerRef: dialogRef, initialFocusRef: closeButtonRef });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 backdrop-blur-sm"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="card relative w-full max-w-sm"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
        >
          <CloseIcon width={18} height={18} />
        </button>
        {title && <h2 className="pr-9 text-lg font-bold text-white">{title}</h2>}
        <div className={title ? "mt-3" : "pr-2"}>{children}</div>
      </div>
    </div>
  );
}
