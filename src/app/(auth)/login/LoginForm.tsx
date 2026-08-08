"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { describeClientError } from "@/lib/describeClientError";

export function LoginForm() {
  const router = useRouter();
  const emailId = useId();
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
        setError("E-mail ou senha inválidos.");
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
        />
      </div>

      <PasswordField
        label="Senha"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        action={
          <Link
            href="/esqueci-senha"
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            Esqueci minha senha
          </Link>
        }
      />

      <FormError message={error} />

      <button type="submit" disabled={submitting} className="btn-primary mt-2 min-h-[52px]">
        {submitting ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-primary underline underline-offset-2">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
