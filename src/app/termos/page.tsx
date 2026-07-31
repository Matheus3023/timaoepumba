export const metadata = { title: "Termos de Uso — Timao e Pumba Tips" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-neutral-300">
      <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
      <p className="mt-4 text-sm leading-relaxed">
        Esta plataforma e destinada exclusivamente a maiores de 18 anos. Ao criar uma conta voce
        declara ter idade legal e concorda com o uso responsavel dos conteudos esportivos,
        estatisticas e recursos de comunidade disponibilizados. Conteudo de analises esportivas
        tem carater informativo e nao constitui garantia de resultado. Consulte a{" "}
        <a href="/privacidade" className="text-yellow-400 underline">
          Politica de Privacidade
        </a>{" "}
        para saber como tratamos seus dados.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-neutral-500">
        Versao 1.0.0 — documento placeholder para desenvolvimento. Substituir pelo texto juridico
        definitivo antes do lancamento em producao.
      </p>
    </div>
  );
}
