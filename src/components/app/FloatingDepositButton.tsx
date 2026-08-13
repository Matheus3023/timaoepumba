/**
 * Botão de depósito FLUTUANTE — fixo em todas as telas do app, igual ao
 * modelo do JR Club. Fica acima da barra de navegação, sempre à mão, pra
 * encurtar o caminho do usuário até o caixa da casa.
 *
 * URL configurável por env (NEXT_PUBLIC_HOUSE_DEPOSIT_URL); default é o site
 * da casa. Abre em nova aba, rel sponsored (link de afiliado).
 */

const DEPOSIT_URL = process.env.NEXT_PUBLIC_HOUSE_DEPOSIT_URL ?? "https://bateu.bet.br/";

export function FloatingDepositButton() {
  return (
    <a
      href={DEPOSIT_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label="Depositar na casa"
      className="fixed right-4 z-40 flex min-h-[46px] items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-black shadow-lg shadow-black/30 active:scale-95"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      <span aria-hidden className="text-base">💰</span>
      Depositar
    </a>
  );
}
