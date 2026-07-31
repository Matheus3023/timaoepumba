import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileActions } from "@/components/app/ProfileActions";

const ACCESS_LEVEL_LABEL: Record<string, string> = {
  VISITOR: "Visitante",
  APP_USER: "Conta criada",
  REGISTERED_USER: "Cadastro confirmado",
  FTD_USER: "FTD confirmado",
  RESTRICTED_USER: "Restrito",
  ADMIN: "Administrador",
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: appUser }, { data: profile }, { data: consents }] = await Promise.all([
    supabase.from("users").select("full_name, email, phone, access_level").eq("id", user!.id).single(),
    supabase.from("user_profiles").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("consents").select("consent_type, granted, granted_at").eq("user_id", user!.id).order("granted_at", { ascending: false }),
  ]);

  const latestMarketingConsent = consents?.find((c) => c.consent_type === "marketing");

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-xl font-bold text-white">Perfil</h1>

      <section className="card mt-4">
        <p className="font-semibold text-white">{appUser?.full_name}</p>
        <p className="text-sm text-neutral-400">{appUser?.email}</p>
        <p className="text-sm text-neutral-400">{appUser?.phone}</p>
        <span className="badge mt-2 inline-block bg-yellow-400/10 text-yellow-300">
          {ACCESS_LEVEL_LABEL[appUser?.access_level ?? "APP_USER"]}
        </span>
      </section>

      {appUser?.access_level === "ADMIN" && (
        <Link
          href="/admin/dashboard"
          className="card-glow mt-4 flex items-center justify-between transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="font-semibold text-white">Painel administrativo</p>
            <p className="text-xs text-neutral-400">Dashboard, CRM, moderacao, campanhas e mais</p>
          </div>
          <span className="text-neutral-500">→</span>
        </Link>
      )}

      <section className="card mt-4">
        <h2 className="text-sm font-semibold text-neutral-200">Instalacao e notificacoes</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
          <li>Aplicativo instalado: {profile?.pwa_install_status === "installed" ? "sim" : "nao"}</li>
          <li>Notificacoes: {profile?.notification_permission ?? "not_requested"}</li>
        </ul>
      </section>

      <ProfileActions marketingConsent={latestMarketingConsent?.granted ?? false} />
    </div>
  );
}
