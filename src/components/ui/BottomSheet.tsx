"use client";

import { useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { useOverlayA11y } from "./useOverlayA11y";

const DRAG_DISMISS_THRESHOLD_PX = 80;

/**
 * Mobile-first overlay sliding up from the bottom (redesign PRD sec.
 * "Bottom sheets") — filters, quick actions, report reasons, etc. Shares
 * the same Escape/focus-trap/scroll-lock behavior as Modal via
 * useOverlayA11y, plus a drag-down-to-dismiss gesture.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useOverlayA11y({ open, onClose, containerRef: sheetRef, initialFocusRef: closeButtonRef });

  if (!open) return null;

  function handleTouchStart(event: React.TouchEvent) {
    dragStartY.current = event.touches[0].clientY;
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const delta = event.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  }

  function handleTouchEnd() {
    if (dragOffset > DRAG_DISMISS_THRESHOLD_PX) {
      onClose();
    }
    setDragOffset(0);
    dragStartY.current = null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragOffset}px)` }}
        className="w-full max-w-md rounded-t-2xl border-t border-white/[0.06] bg-sunken/95 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.5)] transition-transform"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-surface-highlighted" />

        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition hover:bg-surface-elevated hover:text-white"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
