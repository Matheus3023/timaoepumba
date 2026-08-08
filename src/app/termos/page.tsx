import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/landing/LegalLayout";
import { TERMS_VERSION } from "@/lib/legal/versions";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso do Timão e Pumba Tips. Plataforma de conteúdo esportivo informativo, restrita a maiores de 18 anos.",
  alternates: { canonical: "/termos" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso" version={TERMS_VERSION}>
      <p>
        Esta plataforma é destinada exclusivamente a maiores de 18 anos. Ao criar uma conta você
        declara ter idade legal e concorda com o uso responsável dos conteúdos esportivos,
        estatísticas e recursos de comunidade disponibilizados. O conteúdo de análises esportivas
        tem caráter informativo e não constitui garantia de resultado. Consulte a{" "}
        <Link href="/privacidade" className="text-primary underline underline-offset-2">
          Política de Privacidade
        </Link>{" "}
        para saber como tratamos seus dados.
      </p>
      <p className="text-sm text-muted">
        Versão {TERMS_VERSION}. Documento provisório de desenvolvimento, a ser substituído pelo
        texto jurídico definitivo.
      </p>
    </LegalLayout>
  );
}
