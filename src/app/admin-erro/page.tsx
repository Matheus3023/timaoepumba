/**
 * Deliberately outside /admin/* (which is guarded by the same access
 * check that redirects here on failure) so landing on this page can
 * never re-trigger the same redirect — that would either bounce back
 * here again pointlessly or, worse, loop.
 */
export default async function AdminErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-lg font-bold text-red-400">Erro ao carregar o painel administrativo</h1>
      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-surface p-3 font-mono text-xs text-body">
        {message || "Erro desconhecido."}
      </p>
      <p className="mt-3 text-sm text-secondary">
        Isso normalmente indica que a variavel SUPABASE_SERVICE_ROLE_KEY configurada na Vercel esta ausente,
        incorreta ou expirada — confira em Project Settings → Environment Variables e compare com a chave
        &quot;service_role&quot; do Supabase (Project Settings → API).
      </p>
    </div>
  );
}
