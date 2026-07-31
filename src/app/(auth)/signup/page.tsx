"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTrackEvent } from "@/lib/tracking/useTrackEvent";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const trackEvent = useTrackEvent();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackEvent("AppRegistrationStarted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!ageConfirmed || !termsAccepted) {
      setError("Confirme sua maioridade e aceite os termos para continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
          date_of_birth: dateOfBirth,
          age_confirmed: ageConfirmed,
          terms_accepted: termsAccepted,
          privacy_accepted: termsAccepted,
          marketing_consent: marketingConsent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "underage") {
          setError("Voce precisa ter 18 anos ou mais para criar uma conta.");
        } else {
          setError("Nao foi possivel criar sua conta. Verifique os dados e tente novamente.");
        }
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-white">Criar conta</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Jogos, analises e comunidade em um so lugar. Uso restrito a maiores de 18 anos.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Nome completo">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
            autoComplete="name"
          />
        </Field>

        <Field label="E-mail">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </Field>

        <Field label="Telefone">
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            autoComplete="tel"
            placeholder="(11) 91234-5678"
          />
        </Field>

        <Field label="Senha">
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </Field>

        <Field label="Data de nascimento">
          <input
            required
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="input"
          />
        </Field>

        <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
          <label className="flex items-start gap-2.5 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 accent-yellow-400"
            />
            Confirmo que tenho 18 anos ou mais.
          </label>

          <label className="flex items-start gap-2.5 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-yellow-400"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/termos" className="text-yellow-400 underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-yellow-400 underline underline-offset-2">
                Politica de Privacidade
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 accent-yellow-400"
            />
            Quero receber novidades, analises e promocoes por notificacao e e-mail (opcional).
          </label>
        </div>

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
          {submitting ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          Ja tem conta?{" "}
          <Link href="/login" className="text-yellow-400 underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
      {label}
      {children}
    </label>
  );
}
