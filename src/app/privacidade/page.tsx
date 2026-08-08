import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/landing/LegalLayout";
import { PRIVACY_VERSION } from "@/lib/legal/versions";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Timão e Pumba Tips coleta, usa e protege seus dados, e como você pode gerenciar consentimentos, exportar dados ou excluir a conta.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade" version={PRIVACY_VERSION}>
      <p>
        Coletamos dados de cadastro, origem de acesso (campanhas e anúncios) e comportamento no
        aplicativo para personalizar sua experiência, viabilizar o cadastro na casa parceira e
        melhorar nossas comunicações. Você pode gerenciar seus consentimentos, solicitar a
        exportação dos seus dados ou a exclusão da sua conta a qualquer momento pela página de
        perfil.
      </p>
      <p>
        Ao criar a conta você também aceita os{" "}
        <Link href="/termos" className="text-primary underline underline-offset-2">
          Termos de Uso
        </Link>
        .
      </p>
      <p className="text-sm text-muted">
        Versão {PRIVACY_VERSION}. Documento provisório de desenvolvimento, a ser substituído pelo
        texto jurídico definitivo, em conformidade com a LGPD.
      </p>
    </LegalLayout>
  );
}
