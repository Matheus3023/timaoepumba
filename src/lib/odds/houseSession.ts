/**
 * Nome do cookie que guarda o token de sessão da casa.
 *
 * httpOnly: o browser nunca lê. Quem precisa do token para passar ao widget
 * é o componente de servidor da tela de jogo, que lê o cookie e injeta.
 */
export const HOUSE_TOKEN_COOKIE = "tp_house_token";

/**
 * Cookie de sessão da casa (bet7k_session, do login Laravel da Bateu). A
 * carteira valida contra ele; guardamos httpOnly para reenviar no depósito.
 */
export const HOUSE_SESSION_COOKIE = "tp_house_session";
