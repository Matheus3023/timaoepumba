import { loadTickerMatches } from "@/lib/landing/ticker";
import { LandingView } from "@/components/landing/LandingView";

/**
 * Landing publica.
 *
 * Server Component fino: busca os jogos reais e entrega para a view, que e
 * client por causa das animacoes. Antes a pagina inteira era client, e por
 * isso o ticker exibia quatro partidas escritas na mao.
 *
 * ISR de 60s em vez de renderizar por visita: a landing continua sendo
 * servida do cache da borda (rapida, e sem custo por visitante), mas o
 * placar nunca fica mais de um minuto atrasado.
 */
export const revalidate = 60;

export default async function LandingPage() {
  const matches = await loadTickerMatches();
  return <LandingView matches={matches} />;
}
