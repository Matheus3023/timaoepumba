"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { describeClientError } from "@/lib/describeClientError";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("E-mail ou senha invalidos.");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(describeClientError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
      <p className="mt-1 text-sm text-secondary">Acesse sua conta para continuar.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-body">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-body">
          <span className="flex items-center justify-between">
            Senha
            <Link href="/esqueci-senha" className="text-xs font-normal text-primary underline underline-offset-2">
              Esqueci minha senha
            </Link>
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
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
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-muted">
          Ainda nao tem conta?{" "}
          <Link href="/signup" className="text-primary underline underline-offset-2">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
