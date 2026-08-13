import { redirect } from "next/navigation";

/**
 * Tela de liberação antiga — DESATIVADA.
 *
 * No modelo antigo o usuário tinha conta no app e era mandado para a casa
 * para se cadastrar. Agora a conta da Bateu É o login: quem não tem acesso
 * entra (ou cria a conta na Bateu) em /entrar. Esta rota só sobrevive para
 * não quebrar link antigo — manda todo mundo para /entrar.
 */
export default function LiberarPage() {
  redirect("/entrar");
}
