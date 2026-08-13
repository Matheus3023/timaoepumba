import { redirect } from "next/navigation";

/**
 * O cadastro no app acabou: a conta e a da casa (Bateu). Quem cai aqui
 * (link antigo, bookmark) vai para /entrar, que tem o login com a conta da
 * casa e o botao de criar conta pelo link de afiliado.
 */
export default function SignupRedirect() {
  redirect("/entrar");
}
