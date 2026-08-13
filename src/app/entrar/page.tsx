import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HOUSE_TOKEN_COOKIE } from "@/lib/odds/houseSession";
import { HouseLoginForm } from "@/components/app/HouseLoginForm";

/**
 * Login com a conta da casa. Fora do grupo (app) porque o portao de acesso
 * do app manda para ca quem ainda nao tem sessao da casa — se estivesse
 * dentro, seria laco de redirect.
 */
export const metadata = { title: "Entrar" };

export default async function EntrarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ja tem sessao da casa: nao faz sentido pedir login de novo.
  const jaLogado = (await cookies()).get(HOUSE_TOKEN_COOKIE)?.value;
  if (jaLogado) redirect("/home");

  const houseName = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";
  return <HouseLoginForm houseName={houseName} />;
}
