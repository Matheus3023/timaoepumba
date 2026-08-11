import Image from "next/image";
import Link from "next/link";

/**
 * Moldura das paginas juridicas (termos e privacidade).
 *
 * Antes eram dois blocos de texto solto em um fundo preto, sem cabecalho,
 * sem caminho de volta e sem marca. Quem clicava no link durante o cadastro
 * caia numa pagina que nao parecia ser do mesmo produto e so tinha o botao
 * voltar do navegador para escapar.
 */
export function LegalLayout({
  title,
  version,
  children,
}: {
  title: string;
  version: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#080b09]">
      <header className="border-b border-white/[0.05]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Timão e Pumba Tips, início">
            <Image
              src="/icons/icon-512.png"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded-none"
            />
            <span className="text-[15px] font-extrabold tracking-tight text-white">
              Timão<span className="text-primary">&</span>Pumba
            </span>
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center text-sm font-semibold text-body transition-colors hover:text-primary"
          >
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Documento · versão {version}
        </p>
        <h1 className="mt-3 text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-4xl">
          {title}
        </h1>

        <div className="mt-7 flex flex-col gap-4 text-[15px] leading-relaxed text-body">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-secondary">
            <Link href="/termos" className="flex min-h-11 items-center hover:text-primary">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="flex min-h-11 items-center hover:text-primary">
              Política de Privacidade
            </Link>
            <Link href="/login" className="flex min-h-11 items-center hover:text-primary">
              Entrar
            </Link>
          </nav>
          <p className="mt-4 border-t border-white/[0.05] pt-5 text-xs leading-relaxed text-muted">
            Plataforma destinada a maiores de 18 anos. Jogue com responsabilidade. As análises têm
            caráter informativo e não garantem resultado ou lucro.
          </p>
        </div>
      </footer>
    </div>
  );
}
