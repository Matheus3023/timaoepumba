/**
 * URL publica do site, em um lugar so.
 *
 * Serve de base para canonical, og:url, og:image, sitemap e robots. Sem uma
 * base absoluta o Next emite caminho relativo nas meta tags e o WhatsApp
 * nao consegue baixar a imagem do card.
 *
 * Ordem de precedencia: variavel explicita > dominio de producao que a
 * Vercel injeta no build > localhost. Nenhum dominio fica chumbado no
 * codigo, entao trocar de dominio nao exige mexer em arquivo nenhum.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "Timão e Pumba Tips";

/** Titulo e descricao usados no card de compartilhamento. */
export const SHARE_TITLE = "Viva o jogo com a torcida, não sozinho";
export const SHARE_DESCRIPTION =
  "Jogos ao vivo, análises da equipe e comunidade no mesmo app. Conteúdo informativo para maiores de 18 anos.";
