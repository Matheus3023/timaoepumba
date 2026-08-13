/**
 * Botão de depósito — leva a galera direto pro caixa da casa (igual o JR Club).
 *
 * Depósito de quem JÁ tem conta é atribuído a nós pela conta dele (que já
 * nasceu com o nosso afp no cadastro), então aqui é só mandar pro caixa da
 * Bateu. A URL sai de env (NEXT_PUBLIC_HOUSE_DEPOSIT_URL) para apontar pro
 * caixa exato sem tocar em código; o default é o site da casa.
 *
 * `rel="sponsored"` porque é link de afiliado; abre em nova aba pra não tirar
 * a pessoa do app.
 */

const DEPOSIT_URL = process.env.NEXT_PUBLIC_HOUSE_DEPOSIT_URL ?? "https://bateu.bet.br/";
const HOUSE_NAME = process.env.NEXT_PUBLIC_HOUSE_NAME ?? "Bateu Bet";

export function DepositButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={DEPOSIT_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`btn-primary flex min-h-[52px] items-center justify-center gap-2 text-center text-[15px] font-bold ${className}`}
    >
      <span aria-hidden>💰</span>
      Depositar na {HOUSE_NAME}
    </a>
  );
}
