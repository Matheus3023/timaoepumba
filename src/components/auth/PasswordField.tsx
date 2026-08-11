"use client";

import { useId, useState } from "react";

/**
 * Campo de senha com botao de mostrar/ocultar.
 *
 * No celular, digitar senha as cegas com teclado virtual e a causa mais
 * boba de erro de login. O botao tem area de toque de 44px e anuncia o
 * estado por aria-pressed, entao serve tambem para quem navega por teclado.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  autoFocus,
  hint,
  action,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
  autoFocus?: boolean;
  hint?: string;
  /** Link opcional alinhado ao rotulo, tipo "Esqueci minha senha". */
  action?: React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-body">
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <input
          id={id}
          required
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input w-full pr-[86px]"
          autoComplete={autoComplete}
          minLength={minLength}
          autoFocus={autoFocus}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex min-h-11 -translate-y-1/2 items-center rounded-none px-2.5 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:text-primary"
        >
          {visible ? "ocultar" : "mostrar"}
        </button>
      </div>

      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
