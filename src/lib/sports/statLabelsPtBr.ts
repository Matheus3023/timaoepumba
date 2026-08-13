/**
 * Tradução dos rótulos de estatística da Flashscore para PT-BR.
 *
 * A Flashscore devolve os nomes em inglês ("Expected goals (xG)", "Ball
 * possession", ...). A gente NÃO traduz na origem (statsPayload) de propósito:
 * a chave crua em inglês é o identificador estável usado por qualquer cálculo
 * em cima da estatística. A tradução mora só aqui e é aplicada na hora de
 * mostrar na tela.
 *
 * Casamento é por chave normalizada (minúscula, sem acento/pontuação), então
 * "Shots on goal" e "Shots on target" — que a Flashscore usa como sinônimos
 * conforme a competição — caem no mesmo rótulo. Rótulo desconhecido cai no
 * texto original em vez de sumir: melhor mostrar em inglês do que esconder.
 */

const TRADUCOES: Record<string, string> = {
  // Gols / xG
  "expected goals xg": "Gols esperados (xG)",
  "xg on target xgot": "xG no alvo (xGOT)",
  "expected goals on target xgot": "xG no alvo (xGOT)",
  "goals": "Gols",

  // Posse e passes
  "ball possession": "Posse de bola",
  "possession": "Posse de bola",
  "passes": "Passes",
  "total passes": "Passes totais",
  "completed passes": "Passes certos",
  "accurate passes": "Passes certos",
  "crosses": "Cruzamentos",
  "accurate crosses": "Cruzamentos certos",

  // Finalizações
  "total shots": "Finalizações",
  "goal attempts": "Finalizações",
  "shots on target": "Finalizações no gol",
  "shots on goal": "Finalizações no gol",
  "shots off target": "Finalizações para fora",
  "shots off goal": "Finalizações para fora",
  "blocked shots": "Finalizações bloqueadas",
  "shots inside the box": "Finalizações dentro da área",
  "shots outside the box": "Finalizações de fora da área",
  "hit woodwork": "Bola na trave",

  // Chances
  "big chances": "Grandes chances",
  "big chances missed": "Grandes chances perdidas",
  "big chances scored": "Grandes chances convertidas",

  // Bola parada e retomada
  "corner kicks": "Escanteios",
  "corners": "Escanteios",
  "free kicks": "Faltas cobradas",
  "offsides": "Impedimentos",
  "throw in": "Laterais",
  "goal kicks": "Tiros de meta",

  // Defesa / disputa
  "goalkeeper saves": "Defesas do goleiro",
  "saves": "Defesas",
  "fouls": "Faltas",
  "tackles": "Desarmes",
  "interceptions": "Interceptações",
  "clearances": "Cortes",
  "duels won": "Duelos ganhos",
  "aerials won": "Duelos aéreos ganhos",
  "dribbles": "Dribles",

  // Volume de jogo
  "attacks": "Ataques",
  "dangerous attacks": "Ataques perigosos",
  "counter attacks": "Contra-ataques",

  // Cartões e ocorrências
  "yellow cards": "Cartões amarelos",
  "red cards": "Cartões vermelhos",
  "substitutions": "Substituições",
  "injuries": "Lesões",
};

/** Normaliza para casar: minúscula, sem acento, pontuação vira espaço. */
function normalizar(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Rótulo em PT-BR, ou o original se não houver tradução conhecida. */
export function traduzirRotuloEstatistica(label: string): string {
  return TRADUCOES[normalizar(label)] ?? label;
}
