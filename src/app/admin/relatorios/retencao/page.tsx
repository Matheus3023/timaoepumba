import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { computeRetentionReport } from "@/lib/reports/retention";

export default async function RetentionDashboardPage() {
  await requireAdminSection("relatorios");
  const admin = createAdminSupabaseClient();

  const [{ data: users }, { data: profiles }] = await Promise.all([
    admin.from("users").select("id, created_at"),
    admin.from("user_profiles").select("user_id, last_seen_at"),
  ]);

  const report = computeRetentionReport(users ?? [], profiles ?? []);

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Retencao</h1>
      <p className="text-sm text-neutral-400">
        Baseado no ultimo acesso registrado (user_profiles.last_seen_at) — nao ha historico completo de sessoes por
        dia ainda, entao os numeros abaixo sao uma aproximacao, nao uma serie temporal exata.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Ativos hoje (DAU)" value={report.dau} />
        <Metric label="Ativos na semana (WAU)" value={report.wau} />
        <Metric label="Ativos no mes (MAU)" value={report.mau} />
      </div>

      <section className="card mt-6">
        <h2 className="text-sm font-semibold text-neutral-200">Retencao (usuarios ainda ativos N dias depois do cadastro)</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {report.retention.map((r) => (
            <div key={r.days} className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-300">D{r.days}</span>
              <span className="text-neutral-500">
                {r.retained}/{r.eligible} elegiveis
              </span>
              <span className="font-semibold text-yellow-300">{r.pct}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-sm font-semibold text-neutral-200">Coortes por semana de cadastro</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {report.cohorts.map((c) => (
            <div key={c.week} className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-300">{c.week}</span>
              <span className="text-neutral-500">{c.total} cadastros</span>
              <span className="font-semibold text-yellow-300">
                {c.total > 0 ? `${((c.activeLast7d / c.total) * 100).toFixed(0)}%` : "—"} ativos (7d)
              </span>
            </div>
          ))}
          {report.cohorts.length === 0 && <p className="text-neutral-500">Sem dados ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}
