/**
 * Erro de formulario nas telas de entrada.
 *
 * `role="alert"` porque antes o erro era so um paragrafo vermelho: quem usa
 * leitor de tela preenchia o formulario, apertava entrar e nao recebia
 * aviso nenhum de que algo tinha dado errado.
 */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-none border border-error/25 bg-error-soft px-3.5 py-3 text-sm leading-relaxed text-error"
    >
      {message}
    </p>
  );
}
