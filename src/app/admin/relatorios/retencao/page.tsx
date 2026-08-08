import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { computeRetentionReport } from "@/lib/reports/retention";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel, TABLE_HEAD_CLASS, TableShell } from "@/components/admin/Panel";
import { Stat, StatStrip } from "@/components/admin/StatStrip";
import { formatNumber, formatPercent } from "@/components/admin/format";

export default async function RetentionDashboardPage() {
  await requireAdminSection("relatorios");
  const admin = createAdminSupabaseClient();

  const [{ data: users }, { data: profiles }] = await Promise.all([
    admin.from("users").select("id, created_at"),
    admin.from("user_profiles").select("user_id, last_seen_at"),
  ]);

  const report = computeRetentionReport(users ?? [], profiles ?? []);
  const base = users?.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Visão geral"
        title="Retenção"
        description="Aproximação a partir do último acesso registrado (user_profiles.last_seen_at). Ainda não existe histórico de sessões por dia, então estes números mostram tendência, não série temporal exata."
      />

      <StatStrip columns={3}>
        <Stat label="Ativos hoje" value={report.dau} hint={`${formatPercent(report.dau, base, 1)} da base`} />
        <Stat label="Ativos na semana" value={report.wau} hint={`${formatPercent(report.wau, base, 1)} da base`} />
        <Stat label="Ativos no mês" value={report.mau} hint={`${formatPercent(report.mau, base, 1)} da base`} />
      </StatStrip>

      <Panel
        title="Curva de retenção"
        description="Fatia de quem ainda tinha atividade N dias depois de se cadastrar, entre quem já teve tempo de chegar lá."
      >
        <ul className="flex flex-col gap-3">
          {report.retention.map((item) => {
            const ratio = item.eligible > 0 ? (item.retained / item.eligible) * 100 : 0;
            return (
              <li key={item.days}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[13px] tabular-nums text-body">D{item.days}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] tabular-nums text-muted">
                      {formatNumber(item.retained)} de {formatNumber(item.eligible)} elegíveis
                    </span>
                    <span className="w-14 text-right text-sm font-semibold tabular-nums text-white">{item.pct}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-chart-home"
                    style={{ width: `${ratio > 0 ? Math.max(ratio, 1.5) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Coortes por semana de cadastro" description="Últimas 12 semanas." bodyClassName="">
        {report.cohorts.length === 0 ? (
          <p className="p-4 text-sm text-muted">Sem dados ainda.</p>
        ) : (
          <TableShell minWidth={520}>
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Semana
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Cadastros
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Ativos nos últimos 7 dias
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Fatia ativa
                </th>
              </tr>
            </thead>
            <tbody>
              {report.cohorts.map((cohort) => (
                <tr key={cohort.week} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-2 font-mono text-[13px] tabular-nums text-body">{cohort.week}</td>
                  <td className="px-4 py-2 text-right text-[13px] tabular-nums text-strong">
                    {formatNumber(cohort.total)}
                  </td>
                  <td className="px-4 py-2 text-right text-[13px] tabular-nums text-secondary">
                    {formatNumber(cohort.activeLast7d)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-[13px] tabular-nums text-white">
                    {formatPercent(cohort.activeLast7d, cohort.total, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}
