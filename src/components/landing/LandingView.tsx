import Image from "next/image";
import Link from "next/link";
import { BallIcon, ChartIcon, ChatIcon, CheckCircleIcon, CloseIcon } from "@/components/icons";
import { LiveScoreboard } from "@/components/landing/LiveScoreboard";
import type { TickerMatch } from "@/lib/landing/ticker";

/**
 * Landing publica.
 *
 * Server Component de proposito: antes a pagina inteira era client so para
 * animar a entrada dos blocos com framer-motion, o que custava caro no pior
 * cenario possivel (celular em 4G, primeira visita, cache frio) e, pior,
 * deixava o H1 em opacity 0 ate o JS hidratar, ou seja, o maior elemento da
 * tela so aparecia depois do bundle. Agora o HTML ja chega pintado da borda
 * e o unico JS da rota e o fallback de escudo do TeamAvatar.
 *
 * O que sobrou de movimento e CSS puro (entrada do hero e o pulso do "ao
 * vivo"), sempre atras de prefers-reduced-motion.
 */

/** Entrada do hero. Fica fora do H1 de proposito: o titulo e o candidato a
 *  LCP e nao pode comecar invisivel, entao quem anima e o que esta em volta. */
const HERO_MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .tp-in {
    animation: tp-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes tp-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
}
`;

const FEATURES = [
  {
    icon: BallIcon,
    title: "Jogos ao vivo",
    description:
      "Placar, eventos e estatísticas em tempo real dos campeonatos que você acompanha.",
  },
  {
    icon: ChartIcon,
    title: "Análises da equipe",
    description:
      "Publicadas por analistas de verdade, com mercado, nível de risco e contexto. Nada gerado no automático.",
  },
  {
    icon: ChatIcon,
    title: "Comunidade",
    description: "Salas por campeonato, enquetes, reações e resenha ao vivo com outros torcedores.",
  },
];

const STEPS = [
  { title: "Crie sua conta", description: "Leva menos de um minuto." },
  { title: "Cadastre-se na parceira", description: "Um clique gera o seu link exclusivo." },
  { title: "Comunidade liberada", description: "As salas abrem assim que o cadastro é confirmado." },
  { title: "Recursos completos", description: "Análises premium e salas exclusivas destravadas." },
];

const FITS = [
  "Você acompanha futebol de perto e quer os números na mão durante o jogo.",
  "Você prefere análise com critério do que palpite solto em grupo de mensagem.",
  "Você gosta de trocar ideia com quem está assistindo ao mesmo jogo que você.",
];

const DOES_NOT_FIT = [
  "Você procura resultado garantido. Isso não existe, e a gente não promete.",
  "Você tem menos de 18 anos. A plataforma é restrita a maiores de idade.",
  "Você quer que alguém decida por você. Aqui a decisão é sempre sua.",
];

const FAQ = [
  {
    question: "Preciso pagar para usar?",
    answer:
      "Criar a conta é grátis e já dá acesso aos jogos e às análises abertas. Parte do conteúdo e as salas exclusivas abrem depois que você faz o cadastro na casa parceira pelo link do app.",
  },
  {
    question: "Vocês garantem resultado?",
    answer:
      "Não. Análise estatística não garante resultado nenhum. Todo o conteúdo tem caráter informativo, e a decisão final é sempre sua.",
  },
  {
    question: "De onde vêm os placares e as estatísticas?",
    answer:
      "De um provedor de dados esportivos, atualizados durante a partida. Os jogos que aparecem aqui na página são os de hoje, puxados na hora, não um exemplo montado.",
  },
  {
    question: "Funciona bem no celular?",
    answer:
      "O app foi feito para o celular primeiro. Dá para instalar na tela inicial e receber aviso de início de jogo, de análise nova e de movimento na comunidade.",
  },
  {
    question: "Quem escreve as análises?",
    answer:
      "A equipe de analistas do Timão e Pumba. Cada publicação traz o mercado, o nível de risco e o contexto da partida, e passa por revisão antes de ir ao ar.",
  },
];

export function LandingView({ matches }: { matches: TickerMatch[] }) {
  const featured = matches.slice(0, 5);
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-[#080b09]">
      <style
        precedence="tp-landing"
        href="tp-landing-motion"
        dangerouslySetInnerHTML={{ __html: HERO_MOTION_CSS }}
      />

      <header className="relative z-10 border-b border-white/[0.05]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Timão e Pumba Tips, início">
            <Image
              src="/icons/icon-512.png"
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-lg"
              priority
            />
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              Timão<span className="text-primary">&</span>Pumba
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-secondary sm:inline">
              18+
            </span>
            <Link
              href="/entrar"
              className="flex min-h-11 items-center px-2 text-sm font-semibold text-body transition-colors hover:text-primary"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ---------------------------------------------------------------
            HERO. Alinhado a esquerda e assimetrico (texto de um lado, dado
            real do outro) em vez do bloco centralizado com badge + titulo +
            dois botoes, que e o formato que toda landing gerada por IA usa.
            --------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          {/* Faixas de gramado recem-cortado. Substitui as duas bolas
              borradas de luz que estavam no fundo, que nao diziam nada sobre
              futebol e ainda pesavam no paint. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(97deg, rgba(255,255,255,0.022) 0 46px, transparent 46px 92px)",
            }}
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-9 sm:px-8 sm:pt-14 lg:grid lg:grid-cols-12 lg:gap-12 lg:pb-24">
            <div className="lg:col-span-7 lg:pt-6">
              <p className="tp-in flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="h-px w-7 bg-primary/70" />
                Análise esportiva · Ao vivo · Comunidade
              </p>

              <h1 className="mt-5 max-w-[18ch] text-balance text-[1.9rem] font-extrabold leading-[1.06] tracking-[-0.02em] text-white sm:text-5xl lg:text-[3.4rem]">
                Viva o jogo com a <span className="text-primary">torcida</span>, não sozinho
              </h1>

              <p className="tp-in mt-5 max-w-lg text-[15px] leading-relaxed text-secondary sm:text-base">
                Acompanhe as partidas ao vivo, leia as análises de quem entende do assunto e
                participe da comunidade Timão e Pumba. Tudo dentro do app, direto no seu celular.
              </p>

              <div className="tp-in mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <a
                  href="/api/affiliate/click"
                  rel="sponsored"
                  className="btn-primary min-h-[52px] w-full px-7 text-[15px] tracking-wide sm:w-auto"
                >
                  CRIAR CONTA GRÁTIS NA BATEU
                </a>
                <Link
                  href="/entrar"
                  className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-body underline decoration-white/25 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary/60"
                >
                  Já tenho conta
                </Link>
              </div>

              <p className="tp-in mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Criar conta é grátis · Conteúdo para maiores de 18 anos
              </p>
            </div>

            {featured.length > 0 && (
              <div className="tp-in mt-12 lg:col-span-5 lg:mt-0">
                <LiveScoreboard matches={featured} />
                <p className="mt-3 text-[12px] leading-relaxed text-faint">
                  Esses são os jogos de hoje, puxados agora do nosso provedor de dados. Não é
                  vitrine montada: é a mesma base que roda dentro do app.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------
            O QUE VOCE ENCONTRA. Um bloco grande com o recurso que ninguem
            mais tem (Funil ao vivo) e uma lista de linhas finas do lado, em
            vez das tres colunas iguais de icone + titulo + paragrafo.
            --------------------------------------------------------------- */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              01 · O que você encontra
            </p>

            <div className="mt-7 grid gap-8 lg:grid-cols-12 lg:gap-10">
              <article className="card lg:col-span-7 lg:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Durante a partida
                </p>
                <h2 className="mt-2.5 text-xl font-bold text-white sm:text-2xl">Funil ao vivo</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-secondary">
                  Cada jogo em andamento passa por uma lista de critérios objetivos, e você vê,
                  critério por critério, o que os números estão dizendo naquele minuto. Sem palpite
                  de última hora.
                </p>
                <p className="mt-4 border-t border-white/[0.06] pt-4 text-[12px] leading-relaxed text-muted">
                  O T&amp;P Score é uma nota de 0 a 100 para a força do sinal. Não é probabilidade
                  de acerto, e não substitui a sua decisão.
                </p>
              </article>

              <ul className="divide-y divide-white/[0.06] lg:col-span-5">
                {FEATURES.map((feature) => (
                  <li key={feature.title} className="flex gap-3.5 py-4 first:pt-0 last:pb-0">
                    <feature.icon
                      width={18}
                      height={18}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-secondary">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            COMO FUNCIONA. Numeracao em mono, no ritmo de ficha tecnica de
            jogo. Fundo levemente diferente para quebrar a sequencia de
            secoes identicas, uma atras da outra.
            --------------------------------------------------------------- */}
        <section className="border-t border-white/[0.05] bg-white/[0.012]">
          <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              02 · Como funciona
            </p>

            <ol className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-t border-white/10 pt-4">
                  <span className="font-mono text-[13px] font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-[15px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-secondary">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            PARA QUEM E. Qualifica o lead e, de quebra, e onde a conformidade
            aparece como conteudo em vez de letra miuda: sem promessa de
            resultado, restrito a maiores de 18.
            --------------------------------------------------------------- */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              03 · Para quem é
            </p>
            <h2 className="mt-4 max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl">
              Faz sentido pra você?
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Faz sentido se
                </h3>
                <ul className="mt-4 flex flex-col gap-3.5">
                  {FITS.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircleIcon
                        width={17}
                        height={17}
                        className="mt-0.5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-white/10 p-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Não é pra você se
                </h3>
                <ul className="mt-4 flex flex-col gap-3.5">
                  {DOES_NOT_FIT.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CloseIcon
                        width={17}
                        height={17}
                        className="mt-0.5 shrink-0 text-faint"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            PERGUNTAS. <details> nativo: acordeao acessivel, com teclado, e
            zero JavaScript enviado para o celular do visitante.
            --------------------------------------------------------------- */}
        <section className="border-t border-white/[0.05] bg-white/[0.012]">
          <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              04 · Perguntas frequentes
            </p>

            <div className="mt-6">
              {FAQ.map((item) => (
                <details key={item.question} className="group border-b border-white/[0.07]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-4 text-[15px] font-semibold text-strong transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span aria-hidden className="relative h-4 w-4 shrink-0 text-primary">
                      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
                      <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-opacity duration-200 group-open:opacity-0" />
                    </span>
                  </summary>
                  <p className="pb-4 pr-8 text-sm leading-relaxed text-secondary">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final. Mesmo destino do CTA do hero, terceira aparicao na
            pagina, sem inventar urgencia que nao existe. */}
        <section className="border-t border-primary/20 bg-primary/[0.03]">
          <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="max-w-md text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
                  Cria sua conta e acompanha o próximo jogo com a gente
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary">
                  É grátis para criar e leva menos de um minuto. Você decide depois se quer liberar
                  as salas e as análises exclusivas.
                </p>
              </div>

              <div className="flex w-full flex-col items-start gap-3 md:w-auto md:shrink-0 md:items-end">
                <a
                  href="/api/affiliate/click"
                  rel="sponsored"
                  className="btn-primary min-h-[52px] w-full px-7 text-[15px] tracking-wide sm:w-auto"
                >
                  CRIAR CONTA GRÁTIS NA BATEU
                </a>
                <Link
                  href="/entrar"
                  className="flex min-h-11 items-center text-sm font-semibold text-body underline decoration-white/25 underline-offset-4 transition-colors hover:text-primary"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/icon-512.png"
                alt=""
                width={26}
                height={26}
                className="h-[26px] w-[26px] rounded-md"
              />
              <span className="text-sm font-bold tracking-tight text-body">
                Timão<span className="text-primary">&</span>Pumba
              </span>
              <span className="ml-1 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-secondary">
                18+
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-secondary">
              <Link href="/termos" className="flex min-h-11 items-center hover:text-primary">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="flex min-h-11 items-center hover:text-primary">
                Política de Privacidade
              </Link>
              <Link href="/entrar" className="flex min-h-11 items-center hover:text-primary">
                Entrar
              </Link>
            </nav>
          </div>

          <p className="mt-6 max-w-2xl border-t border-white/[0.05] pt-6 text-xs leading-relaxed text-muted">
            Plataforma destinada a maiores de 18 anos. Jogue com responsabilidade. As análises têm
            caráter informativo e não garantem resultado ou lucro. Se o jogo deixou de ser diversão,
            procure orientação especializada.
          </p>
          <p className="mt-3 font-mono text-[11px] text-faint">
            © {year} Timão e Pumba Tips. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
