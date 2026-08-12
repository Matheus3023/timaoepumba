/**
 * Tipos de domínio para odds da casa.
 *
 * Deliberadamente independentes do formato de qualquer fornecedor: hoje a
 * origem é a Altenar (plataforma white-label que roda o sportsbook da Bateu
 * Bet), mas se a Bateu conseguir um feed oficial a troca tem de ser de
 * adapter, não de tipo. Nada fora de `src/lib/odds/` conhece "typeId",
 * "oddIds" ou qualquer outro nome de campo da Altenar.
 */

export interface OddsSelection {
  /** Rótulo como a casa exibe: "Empate", "São Paulo", "mais de". */
  name: string;
  /** Cotação decimal. */
  price: number;
}

export interface OddsMarket {
  providerMarketId: string;
  /** "Vencedor do encontro", "Total de gols", "Escanteios asiático". */
  name: string;
  /** Linha do mercado quando existe ("3.5", "1.5"), senão null. */
  line: string | null;
  /**
   * Grupo como a casa organiza na tela ("Principal", "Escanteios", "2° tempo").
   * Só o endpoint de detalhe traz; na listagem vem null.
   */
  group?: string | null;
  selections: OddsSelection[];
}

export interface HouseOddsEvent {
  providerEventId: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 UTC. */
  startsAt: string;
  championship: string | null;
  markets: OddsMarket[];
  /** Relógio da casa ("68'"). Só no endpoint de detalhe. */
  liveClock?: string | null;
  /** Período como a casa exibe ("2ª parte"). Só no endpoint de detalhe. */
  livePeriod?: string | null;
}

/**
 * Resultado do casamento entre uma partida nossa (Flashscore) e um evento da
 * casa. É um resultado tipado em vez de `HouseOddsEvent | null` de propósito:
 * "não achei" e "achei dois candidatos e não sei qual" exigem tratamento
 * diferente — o segundo é sinal de heurística frouxa e precisa aparecer no log,
 * nunca virar um casamento silencioso e errado.
 */
export type OddsMatchResult =
  | { status: "matched"; event: HouseOddsEvent }
  | { status: "not_found" }
  | { status: "ambiguous"; candidates: HouseOddsEvent[] };

/** O mínimo que o casamento precisa saber sobre a partida do nosso lado. */
export interface FixtureKey {
  /** Como a Flashscore nomeia — costuma vir abreviado: "BOL", "SAO". */
  homeTeamName: string;
  awayTeamName: string;
  /** ISO 8601 UTC. */
  kickoffAt: string;
}
