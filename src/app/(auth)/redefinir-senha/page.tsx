"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { describeClientError } from "@/lib/describeClientError";

export default function ResetPasswordPage() {
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
      setError("As senhas nao coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("Nao foi possivel redefinir a senha. Solicite um novo link e tente de novo.");
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

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-white">Nova senha</h1>
      <p className="mt-1 text-sm text-secondary">Escolha uma nova senha para sua conta.</p>

      {done ? (
        <div className="card-glow mt-8">
          <p className="text-sm text-strong">Senha redefinida! Redirecionando...</p>
        </div>
      ) : !ready ? (
        <div className="card mt-8">
          <p className="text-sm text-secondary">
            {error ??
              "Validando o link de recuperacao... Se voce abriu esta pagina diretamente (sem clicar no link do e-mail), solicite uma nova recuperacao de senha."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-body">
            Nova senha
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-body">
            Confirmar nova senha
            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
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
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
