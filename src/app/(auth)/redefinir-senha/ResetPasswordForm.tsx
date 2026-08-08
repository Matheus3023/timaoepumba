"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { describeClientError } from "@/lib/describeClientError";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The link from the recovery e-mail carries a token in the URL that
    // @supabase/ssr's browser client parses automatically on load,
    // establishing a temporary "recovery" session. We just wait for that
    // to settle before allowing the form to submit.
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setReady(true);
        }
      });

      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      // Deferred so this doesn't count as a synchronous setState-in-effect
      // (the createClient() throw path is exceptional, not the normal
      // async-callback flow the other setReady() calls above use).
      queueMicrotask(() => setError(describeClientError(err)));
    }
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("Não foi possível redefinir a senha. Solicite um novo link e tente de novo.");
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push("/home");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(describeClientError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card-glow mt-8" role="status">
        <p className="text-sm text-strong">Senha redefinida. Levando você para o app...</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <div className="card" role="status">
          <p className="text-sm leading-relaxed text-secondary">
            {error ??
              "Validando o link de recuperação. Se você abriu esta página direto, sem clicar no link do e-mail, peça uma nova recuperação de senha."}
          </p>
        </div>
        <Link href="/esqueci-senha" className="btn-secondary min-h-[52px] text-center">
          Pedir um novo link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <PasswordField
        label="Nova senha"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
        hint="Mínimo de 8 caracteres."
        autoFocus
      />

      <PasswordField
        label="Confirmar nova senha"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        minLength={8}
      />

      <FormError message={error} />

      <button type="submit" disabled={submitting} className="btn-primary mt-2 min-h-[52px]">
        {submitting ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
