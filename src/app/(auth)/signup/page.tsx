import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Criar conta grátis",
  description:
    "Crie sua conta no Timão e Pumba Tips e acompanhe jogos ao vivo, análises da equipe e a comunidade. Uso restrito a maiores de 18 anos.",
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Criar conta grátis | Timão e Pumba Tips",
    description:
      "Jogos ao vivo, análises da equipe e comunidade no mesmo app. Uso restrito a maiores de 18 anos.",
    url: "/signup",
  },
};

export default function SignupPage() {
  return (
    <AuthLayout>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
        Leva menos de um minuto
      </p>
      <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white">
        Criar conta
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Jogos, análises e comunidade em um só lugar. Uso restrito a maiores de 18 anos.
      </p>

      <SignupForm />
    </AuthLayout>
  );
}
