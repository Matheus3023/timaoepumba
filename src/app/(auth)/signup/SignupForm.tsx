"use client";

import { useEffect, useId, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTrackEvent } from "@/lib/tracking/useTrackEvent";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { describeClientError } from "@/lib/describeClientError";

/**
 * Formata o telefone enquanto a pessoa digita: (11) 91234-5678.
 *
 * Nao e enfeite. O telefone alimenta o funil da casa parceira, e antes
 * chegava do jeito que cada um digitou (com ponto, sem DDD, com +55), o que
 * transforma qualquer conferencia de base em trabalho manual.
 */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function TextField({
  label,
  hint,
  ...inputProps
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-body">
        {label}
      </label>
      <input
        id={id}
        className="input w-full"
        aria-describedby={hint ? hintId : undefined}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SignupForm() {
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
          setError("Você precisa ter 18 anos ou mais para criar uma conta.");
        } else if (
          typeof data.error === "string" &&
          /already\s*(registered|exists)|user_already/i.test(data.error)
        ) {
          // Antes esse caso caia no erro generico e a pessoa ficava tentando
          // de novo com o mesmo e-mail, sem entender o que estava errado.
          setError("Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.");
        } else {
          setError("Não foi possível criar sua conta. Confira os dados e tente novamente.");
        }
        return;
      }

      // Emenda direto no cadastro da casa, em vez de passar pelo onboarding
      // primeiro. Quem acabou de preencher um formulario esta no melhor
      // momento para preencher o segundo — depois de instalar PWA e aceitar
      // notificacao, a conversao despenca. O onboarding acontece na volta,
      // porque o layout do app cobra ele antes do /home.
      router.push("/liberar");
    } catch (err) {
      setError(describeClientError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <TextField
        label="Nome completo"
        required
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        autoCapitalize="words"
      />

      <TextField
        label="E-mail"
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
      />

      <TextField
        label="Telefone"
        required
        value={phone}
        onChange={(event) => setPhone(formatPhone(event.target.value))}
        autoComplete="tel"
        inputMode="tel"
        placeholder="(11) 91234-5678"
      />

      <PasswordField
        label="Senha"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
        hint="Mínimo de 8 caracteres."
      />

      <TextField
        label="Data de nascimento"
        required
        type="date"
        value={dateOfBirth}
        onChange={(event) => setDateOfBirth(event.target.value)}
        hint="Precisamos confirmar que você tem 18 anos ou mais."
      />

      <fieldset className="mt-1 flex flex-col gap-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Confirmações
        </legend>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(event) => setAgeConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          Confirmo que tenho 18 anos ou mais.
        </label>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="text-primary underline underline-offset-2">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-primary underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-secondary">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          Quero receber novidades, análises e promoções por notificação e e-mail (opcional).
        </label>
      </fieldset>

      <FormError message={error} />

      <button type="submit" disabled={submitting} className="btn-primary mt-1 min-h-[52px]">
        {submitting ? "Criando conta..." : "Criar conta grátis"}
      </button>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
