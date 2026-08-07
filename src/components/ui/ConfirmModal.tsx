"use client";

import { Modal } from "./Modal";

/**
 * Standard confirmation dialog (redesign PRD sec. "Modal de confirmacao").
 * Built on Modal so it inherits Escape/focus-trap/scroll-lock for free —
 * meant to replace ad hoc `window.confirm()` calls, which can't be styled,
 * don't respect the app's design, and block the JS thread.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  confirmDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="pr-9 text-lg font-bold text-white">{title}</h2>
      <p className="mt-1.5 text-sm text-secondary">{description}</p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={
            destructive
              ? "flex-1 rounded-xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              : "btn-primary flex-1"
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
