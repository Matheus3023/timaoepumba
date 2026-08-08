import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Receba um link por e-mail para redefinir a senha da sua conta Timão e Pumba Tips.",
  // Pagina de servico: util para quem esta logado no fluxo, inutil no
  // resultado de busca da marca.
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Acesso</p>
      <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white">
        Recuperar senha
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
      </p>

      <ForgotPasswordForm />
    </AuthLayout>
  );
}
