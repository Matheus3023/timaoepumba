import { redirect } from "next/navigation";

/**
 * Login antigo do app (conta Supabase) — DESATIVADO.
 *
 * Não existe mais conta do app: a porta de entrada é a conta da Bateu, em
 * /entrar. Esta rota só sobrevive para não quebrar links antigos, marcadores
 * e o e-mail de quem já tinha o endereço — todo mundo vai para /entrar.
 *
 * Era aqui que o usuário se perdia: digitava a senha da Bateu numa tela que
 * validava contra o nosso banco e nunca batia.
 */
export default function LoginPage() {
  redirect("/entrar");
}
