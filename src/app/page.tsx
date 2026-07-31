import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-extrabold tracking-tight text-white">
          Timao<span className="text-yellow-400">&</span>Pumba Tips
        </span>
        <span className="badge bg-red-500/20 text-red-300">18+</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Jogos, analises e comunidade esportiva em um so lugar
        </h1>
        <p className="mt-4 max-w-md text-neutral-400">
          Acompanhe partidas ao vivo, estatisticas, analises publicadas por especialistas e
          participe da comunidade Timao e Pumba.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link href="/signup" className="btn-primary text-center">
            CRIAR CONTA GRATIS
          </Link>
          <Link href="/login" className="btn-secondary text-center">
            JA TENHO CONTA
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <FeatureCard title="Jogos ao vivo" description="Acompanhe partidas e resultados em tempo real." />
          <FeatureCard title="Analises" description="Conteudo publicado por analistas da casa." />
          <FeatureCard title="Comunidade" description="Salas por campeonato, enquetes e reacoes." />
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-neutral-500">
        <p>
          Plataforma destinada a maiores de 18 anos. Jogue com responsabilidade. Nao garantimos
          resultados ou lucro. Se precisar de ajuda, procure orientacao especializada.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card text-left">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-400">{description}</p>
    </div>
  );
}
