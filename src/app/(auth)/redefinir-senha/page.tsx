import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nova senha",
  description: "Escolha uma nova senha para a sua conta Timão e Pumba Tips.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Acesso</p>
      <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white">
        Nova senha
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Escolha uma nova senha para a sua conta.
      </p>

      <ResetPasswordForm />
    </AuthLayout>
  );
}
