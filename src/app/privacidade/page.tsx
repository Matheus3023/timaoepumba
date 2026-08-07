export const metadata = { title: "Politica de Privacidade — Timao e Pumba Tips" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-body">
      <h1 className="text-2xl font-bold text-white">Politica de Privacidade</h1>
      <p className="mt-4 text-sm leading-relaxed">
        Coletamos dados de cadastro, origem de acesso (campanhas e anuncios) e comportamento no
        aplicativo para personalizar sua experiencia, viabilizar o cadastro na casa parceira e
        melhorar nossas comunicacoes. Voce pode gerenciar seus consentimentos, solicitar a
        exportacao dos seus dados ou a exclusao da sua conta a qualquer momento pela pagina de
        perfil.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Versao 1.0.0 — documento placeholder para desenvolvimento. Substituir pelo texto juridico
        definitivo (LGPD) antes do lancamento em producao.
      </p>
    </div>
  );
}
