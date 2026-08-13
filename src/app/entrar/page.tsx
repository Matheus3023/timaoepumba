import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { HOUSE_TOKEN_COOKIE } from "@/lib/odds/houseSession";
import { HouseLoginForm } from "@/components/app/HouseLoginForm";

/**
 * Login com a conta da casa — a ÚNICA porta de entrada do app.
 *
 * NÃO exige sessão do app: quem chega aqui normalmente NÃO tem conta nossa
 * ainda (não existe cadastro no app). A pessoa entra com a conta da Bateu, e
 * é o /api/house/login que provisiona a conta e abre a sessão. Por isso esta
 * página tem que renderizar para visitante deslogado — se exigisse sessão,
 * mandaria todo mundo de volta para uma tela de login que não existe mais.
 *
 * Fica fora do grupo (app) para o portão de acesso poder mandar para cá sem
 * cair em laço de redirect.
 */
export const metadata = { title: "Entrar" };

export default async function EntrarPage() {
  // Já tem sessão da casa: não faz sentido pedir login de novo.
  const jaLogado = (await cookies()).get(HOUSE_TOKEN_COOKIE)?.value;
  if (jaLogado) redirect("/home");

  const houseName = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";
  return <HouseLoginForm houseName={houseName} />;
}
