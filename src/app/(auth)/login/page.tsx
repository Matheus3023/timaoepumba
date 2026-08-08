import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "./LoginForm";

/**
 * A pagina em si e Server Component: titulo e moldura ja chegam pintados,
 * e so o formulario (que precisa de estado) vai para o cliente. Antes a
 * rota inteira era client e a tela ficava em branco ate hidratar.
 */
export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua conta do Timão e Pumba Tips para ver os jogos ao vivo, as análises da equipe e a comunidade.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Entrar | Timão e Pumba Tips",
    description: "Acesse sua conta para ver os jogos ao vivo, as análises e a comunidade.",
    url: "/login",
  },
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Sua conta</p>
      <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white">
        Bem-vindo de volta
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Entre para acompanhar os jogos de hoje, as análises da equipe e a resenha na comunidade.
      </p>

      <LoginForm />
    </AuthLayout>
  );
}
