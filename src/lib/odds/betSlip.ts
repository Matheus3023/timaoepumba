/**
 * Boletim de apostas do app.
 *
 * O app NÃO aceita aposta — quem aceita é a casa, que é quem tem licença.
 * Este boletim serve para o usuário montar a seleção aqui dentro, ver quanto
 * pode voltar, e sair uma única vez já sabendo o que vai apostar. É a
 * diferença entre mandar o cara para o site e ele se perder, e mandar com a
 * escolha pronta.
 *
 * Por isso tudo aqui é cálculo e regra de composição — nada de rede.
 */

export interface SlipSelection {
  /** Identifica o mercado de origem: duas seleções do mesmo mercado se excluem. */
  marketId: string;
  marketName: string;
  /** Linha do mercado quando existe ("2.5"), só para exibição. */
  line: string | null;
  selectionName: string;
  odd: number;
  /** Id da cotação na casa — o que o SDK dela recebe. */
  providerOddId: string;
  /** Para agrupar por partida quando o boletim passar a aceitar vários jogos. */
  eventId: string;
  eventName: string;
}

/**
 * Adiciona (ou troca) uma seleção.
 *
 * Duas seleções do MESMO mercado são mutuamente exclusivas — ninguém aposta
 * em "Mais de 2.5" e "Menos de 2.5" ao mesmo tempo, e a casa recusaria o
 * bilhete. Escolher outra opção do mesmo mercado substitui a anterior, que
 * é o comportamento que todo boletim de casa tem.
 *
 * Clicar de novo na MESMA seleção remove — é assim que se desmarca.
 */
export function toggleSelection(current: SlipSelection[], next: SlipSelection): SlipSelection[] {
  const mesmaSelecao = current.find(
    (item) => item.marketId === next.marketId && item.selectionName === next.selectionName
  );
  if (mesmaSelecao) {
    return current.filter((item) => item !== mesmaSelecao);
  }
  return [...current.filter((item) => item.marketId !== next.marketId), next];
}

export function isSelected(current: SlipSelection[], marketId: string, selectionName: string): boolean {
  return current.some((item) => item.marketId === marketId && item.selectionName === selectionName);
}

/**
 * Odd combinada de uma múltipla: o produto das cotações decimais.
 *
 * Boletim vazio devolve 0, não 1. Um produto vazio matematicamente é 1, mas
 * aqui 1 significaria "aposta que devolve exatamente o que entrou" e faria a
 * tela mostrar retorno igual ao valor apostado sem nenhuma seleção.
 */
export function combinedOdds(selections: SlipSelection[]): number {
  if (selections.length === 0) return 0;
  return selections.reduce((total, item) => total * item.odd, 1);
}

/**
 * Retorno potencial bruto (o que a casa paga, já incluindo o valor apostado).
 *
 * Arredonda para baixo no centavo: mostrar retorno maior do que a casa vai
 * pagar é o tipo de erro que destrói confiança de quem aposta.
 */
export function potentialReturn(selections: SlipSelection[], stake: number): number {
  const odds = combinedOdds(selections);
  if (odds <= 0 || !Number.isFinite(stake) || stake <= 0) return 0;
  return Math.floor(odds * stake * 100) / 100;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatOdd(value: number): string {
  return value.toFixed(2);
}
