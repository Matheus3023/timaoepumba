import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { needsRegistration } from "@/lib/entitlements/levels";
import { LiberarClient } from "@/components/app/LiberarClient";

/**
 * Tela de liberação: o usuário tem conta no app mas ainda não tem cadastro
 * na casa parceira.
 *
 * Mora FORA do grupo de rotas `(app)` de propósito. Se ficasse dentro, o
 * layout do app redirecionaria para cá, e esta página redirecionaria para
 * lá — laço infinito.
 */
export const metadata = { title: "Libere seu acesso" };

export default async function LiberarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appUser } = await supabase
    .from("users")
    .select("access_level")
    .eq("id", user.id)
    .maybeSingle();

  // Já liberado (ou portão desligado): não faz sentido segurar aqui.
  if (!needsRegistration(appUser?.access_level)) {
    redirect("/home");
  }

  const houseName = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";

  return <LiberarClient houseName={houseName} />;
}
