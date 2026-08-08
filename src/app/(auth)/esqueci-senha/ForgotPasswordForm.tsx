"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FormError } from "@/components/auth/FormError";
import { describeClientError } from "@/lib/describeClientError";

export function ForgotPasswordForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (resetError) {
        setError("Não foi possível enviar o e-mail. Tente novamente em instantes.");
        return;
      }

      setSent(true);
    } catch (err) {
      setError(describeClientError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <div className="card-glow" role="status">
          <p className="text-sm leading-relaxed text-strong">
            Se existir uma conta com o e-mail{" "}
            <span className="font-semibold text-white">{email}</span>, você vai receber um link para
            redefinir a senha em instantes.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Não chegou? Confira a caixa de spam antes de pedir outro link.
          </p>
        </div>
        <Link href="/login" className="btn-secondary min-h-[52px] text-center">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-sm text-body">
          E-mail
        </label>
        <input
          id={emailId}
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input w-full"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
        />
      </div>

      <FormError message={error} />

      <button type="submit" disabled={submitting} className="btn-primary mt-2 min-h-[52px]">
        {submitting ? "Enviando..." : "Enviar link de recuperação"}
      </button>

      <p className="text-center text-sm text-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
