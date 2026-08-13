import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "../login/LoginForm";

/**
 * Login interno (equipe/admin) — conta do app (Supabase), email + senha.
 *
 * Separado da porta dos apostadores de propósito: o apostador entra com a
 * conta da Bateu em /entrar; a equipe entra aqui, com a conta do app. Sem
 * essa rota, matar a /login velha trancaria a equipe para fora do /admin.
 *
 * Rota discreta e fora de indexação: não é para o apostador cair aqui.
 */
export const metadata: Metadata = {
  title: "Acesso interno",
  robots: { index: false, follow: false },
};

export default function AcessoInternoPage() {
  return (
    <AuthLayout>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Equipe</p>
      <h1 className="mt-2.5 text-[1.65rem] font-extrabold leading-tight tracking-[-0.02em] text-white">
        Acesso interno
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        Área da equipe. Entre com a conta do app (e-mail e senha).
      </p>

      <LoginForm />
    </AuthLayout>
  );
}
