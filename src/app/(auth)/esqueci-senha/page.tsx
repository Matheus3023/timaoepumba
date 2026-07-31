"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { describeClientError } from "@/lib/describeClientError";

export default function ForgotPasswordPage() {
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
        setError("Nao foi possivel enviar o e-mail. Tente novamente em instantes.");
        return;
      }

      setSent(true);
    } catch (err) {
      setError(describeClientError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
      </p>

      {sent ? (
        <div className="mt-8 flex flex-col gap-4">
          <div className="card-glow">
            <p className="text-sm text-neutral-200">
              Se existir uma conta com o e-mail <span className="font-semibold text-white">{email}</span>,
              voce vai receber um link para redefinir a senha em instantes.
            </p>
          </div>
          <Link href="/login" className="btn-secondary text-center">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
              autoFocus
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" disabled={submitting} className="btn-primary mt-2">
            {submitting ? "Enviando..." : "Enviar link de recuperacao"}
          </button>

          <p className="text-center text-xs text-neutral-500">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-yellow-400 underline underline-offset-2">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
