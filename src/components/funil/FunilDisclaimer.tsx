/**
 * Aviso obrigatório (PRD sec. 57). Discreto, mas presente em toda tela do
 * Funil. O T&P Score nunca é apresentado como probabilidade de acerto, e não
 * existe promessa de resultado em lugar nenhum do produto.
 */
export function FunilDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`mt-6 text-center text-[11px] leading-relaxed text-faint ${className}`}>
      18+ • Analises estatisticas nao garantem resultados. A forca do sinal e uma nota de 0 a 100, nao uma
      probabilidade de acerto. Aposte com responsabilidade.
    </p>
  );
}
